// Documentation for the Wikimedia Imageinfo API is available under
// https://www.mediawiki.org/wiki/API:Imageinfo

import { types } from '@get-me-drunk/common';
import { fetch } from './fetch.js';
import { DeepPartial, discerpInBatches, isDeepNonNullable, NonEmptyArray } from "./util.js";

export interface ImageMetadata {
    width: number;
    height: number;
    url: string;
}
export interface ImageInfo {
    originalImage: ImageMetadata & { sizeInBytes: number; };
    scaledImage: ImageMetadata;
    mimeType: string;
}

interface WikimediaRootInfo {
    batchcomplete: string,
    query: WikimediaQueryInfo
}
interface WikimediaQueryInfo {
    normalized: any;
    pages: {
        [index: number]: WikimediaPageInfo
    };
}
interface WikimediaPageInfo {
    title: string;
    imageinfo: {
        [index: number]: WikimediaImageInfo
    };
}
interface WikimediaImageInfo {
    size: number;
    width: number;
    height: number;
    thumburl: string;
    thumbwidth: number;
    thumbheight: number;
    responsiveUrls: {
        2: string;
        1.5: string;
    };
    url: string;
    mime: string;
    descriptionurl: string;
}

export async function fetchScalingImageInfo<D extends Array<types.IDrink>>(
    drinks: D,
    maxDimensions: {
        width: number,
        height: number
    }
): Promise<{
    [K in typeof drinks[number]['name']]: ImageInfo
} | null> {
    type DrinkInfoMapping = { [K in typeof drinks[number]['name']]: ImageInfo };

    // Only fetch image information for drinks that have 
    const drinksWithImages = drinks.filter(it => !!it.image);

    const fetchTasks: Array<Promise<DrinkInfoMapping>> = [];
    for (let batch of discerpInBatches(drinksWithImages, 50)) {
        fetchTasks.push(fetchScalingImageInfo0(batch, maxDimensions) as Promise<DrinkInfoMapping>);
    }

    const infoMappings = await Promise.all(fetchTasks);
    return infoMappings.reduce((acc, mapping) => Object.assign(acc, mapping), {} as any);
}

async function fetchScalingImageInfo0<D extends NonEmptyArray<types.IDrink>>(
    drinks: D,
    maxDimensions: {
        width: number,
        height: number
    }
): Promise<{
    [K in typeof drinks[number]['name']]: ImageInfo
} | null> {
    if (drinks.length > 50) {
        throw new Error("Drinks array must contain 50 drinks at most");
    }

    function groupDrinksByImage(drinks: D): Map<string, Array<typeof drinks[number]>> {
        const imageToDrinks: Map<string, Array<typeof drinks[number]>> = new Map();
        for (let drink of drinks) {
            // At this point, the Wikimedia (image) URLs are normalized, i.e., in the form 
            // https://commons.wikimedia.org/wiki/<image_identifier>
            const imageUrl = new URL(drink.image!);
            const matchInfo = imageUrl.pathname.match(/\/wiki\/(File:.+\.\w{1,3})/);

            if (matchInfo === null) {
                console.log(`[image-info] Warning: Wikimedia URL ${drink.image} does not match the expected pattern`);
                continue;
            }

            const imageIdentifier = decodeURIComponent(matchInfo[1]);

            let drinksList = imageToDrinks.get(imageIdentifier);
            if (drinksList === undefined) {
                drinksList = [];
                imageToDrinks.set(imageIdentifier, drinksList);
            }

            drinksList.push(drink);
        }

        return imageToDrinks;
    }

    const imageToDrinks = groupDrinksByImage(drinks);
    const imageIdentifiers = Array.from(imageToDrinks.keys());

    if (imageIdentifiers.length !== drinks.length) {
        console.error(`[image-info] Warning: There are ${drinks.length - imageToDrinks.size} cocktails sharing images`);
    }

    function buildImagedataRequestUrl(imageIdentifier: Array<string>): string {
        let url = new URL("https://www.wikidata.org/w/api.php");
        url.searchParams.append("action", "query");
        url.searchParams.append("format", "json");
        url.searchParams.append("prop", "imageinfo");
        url.searchParams.append("iiprop", "url|mime|size");
        url.searchParams.append("iiurlwidth", maxDimensions.width.toFixed(0));
        url.searchParams.append("iiurlheight", maxDimensions.height.toFixed(0));

        // Bar-separated list of all Wikimedia image files
        // e.g.: File:Martini.jpg|File:Vodka.jpg
        const drinksParamValue = Array.from(imageIdentifier)
            .reduce(
                (acc, imageUrl) => `${acc}|${imageUrl}`,
                ""
            ).slice(1);
        url.searchParams.append("titles", drinksParamValue);

        return url.toString();
    }

    const requestUrl = buildImagedataRequestUrl(imageIdentifiers);
    console.log(`[image-info] Fetching image data information: ${requestUrl}`);
    const result = await fetch<'application/json'>(requestUrl, {
        method: 'GET',
        accept: 'application/json'
    });

    if (result.type === 'redirect') {
        throw new Error("Unexpected redirect");
    }
    if (result.type === 'error') {
        throw new Error(result.error);
    }

    const parsedResult = JSON.parse(result.body.content) as Partial<WikimediaRootInfo>;

    const indexedSearchResults = parsedResult?.query?.pages;
    if (!indexedSearchResults) {
        throw new Error("Unexpected result: " + result.body.content);
    }

    const searchResults = Object.values(indexedSearchResults);
    if (searchResults.length !== imageIdentifiers.length) {
        console.log(`[image-info] Warning: Search results are lacking ` 
            + `${imageIdentifiers.length - searchResults.length} items`);
    }

    let res: { [K in typeof drinks[number]['name']]: ImageInfo } = {} as any;
    for (let searchResult of Object.values(indexedSearchResults)) {
        const page = searchResult as Partial<WikimediaPageInfo>;

        // The 'title' property indicates the file's display name.  As of today, the file's display name is identical
        // to its actual name, except that spaces are replaced by underscores.  We make use of this property to 
        // keep the matching logic simple.  If this premise ever breaks, we can still resort to the mapping from 
        // file names to display names provided by the query's 'normalized'.
        const imageIdentifier = page.title?.replace(/ /g, "_");
        const imageInfo = page?.imageinfo?.[0];
        if (!imageInfo || !imageIdentifier) {
            console.error("[image-info] Warning: Invalid/empty/malformed search result entry for "
                + searchResult.title);
            continue;
        }

        const drinks = imageToDrinks.get(imageIdentifier);
        if (!drinks) {
            console.error(`[image-info] Warning: Couldn't map result for image ${imageIdentifier} to drink`);
            continue;
        }

        const assembledImageInfo: DeepPartial<ImageInfo> = {
            mimeType: imageInfo?.mime,
            originalImage: {
                url: imageInfo?.descriptionurl,
                height: imageInfo?.height,
                width: imageInfo?.width,
                sizeInBytes: imageInfo?.size
            },
            scaledImage: {
                url: imageInfo?.thumburl,
                height: imageInfo?.thumbheight,
                width: imageInfo?.thumbwidth
            }
        };

        if (!isDeepNonNullable(assembledImageInfo)) {
            console.error(`[image-info] Warning: Image information for image ${imageIdentifier} is incomplete`);
            continue;
        }

        for (let drink of drinks) {
            res[drink.name as typeof drinks[number]['name']] = assembledImageInfo;
        }
    }

    return res;
}
