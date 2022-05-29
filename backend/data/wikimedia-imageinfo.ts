// Documentation for the Wikimedia Imageinfo API is available under
// https://www.mediawiki.org/wiki/API:Imageinfo

import { IDrink } from "../../types";
import { fetch } from "./fetch";
import { DeepPartial, discerpInBatches, isDeepNonNullable, NonEmptyArray } from "./util";

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

export async function fetchScalingImageInfo<D extends Array<IDrink>>(
    drinks: D,
    maxDimensions: {
        width: number,
        height: number
    }
): Promise<{
    [K in typeof drinks[number]['name']]: ImageInfo
} | null> {
    type DrinkInfoMapping = { [K in typeof drinks[number]['name']]: ImageInfo };

    const drinksWithImages = drinks.filter(it => !!it);

    const fetchTasks: Array<Promise<DrinkInfoMapping>> = [];
    for (let batch of discerpInBatches(drinksWithImages, 50)) {
        console.log(batch.map(it => it.name));
        fetchTasks.push(fetchScalingImageInfo0(batch, maxDimensions) as Promise<DrinkInfoMapping>);
    }

    const infoMappings = await Promise.all(fetchTasks);
    return infoMappings.reduce((acc, mapping) => Object.assign(acc, mapping), {} as any);
}

async function fetchScalingImageInfo0<D extends NonEmptyArray<IDrink>>(
    drinks: D,
    maxDimensions: {
        width: number,
        height: number
    }
): Promise<{
    [K in typeof drinks[number]['name']]: ImageInfo
} | null> {

    // const imageMapping: Map<string, typeof drinks[number]> = new Map();

    let url = new URL("https://www.wikidata.org/w/api.php");
    url.searchParams.append("action", "query");
    url.searchParams.append("format", "json");
    url.searchParams.append("prop", "imageinfo");
    url.searchParams.append("iiprop", "url|mime|size");
    url.searchParams.append("iiurlwidth", maxDimensions.width.toFixed(0));
    url.searchParams.append("iiurlheight", maxDimensions.height.toFixed(0));

    // Bar-separated list of all Wikimedia image files
    // e.g.: File:Martini.jpg|File:Vodka.jpg
    // Wikimedia image URLs are provided in the URL scheme https://commons.wikimedia.org/wiki/<ref>
    const drinksParamValue = (drinks
        .map(it => {
            const imageUrl = new URL(it.image!);
            const matchInfo = imageUrl.pathname.match(/\/wiki\/(File:.+\.\w{1,3})/);

            if (matchInfo === null) {
                console.log("Warning: in imageinfo: Image URL does not match the expected pattern", it.image!);
                return null;
            }

            return decodeURIComponent(matchInfo[1]);
        })
        .filter(it => it !== null) as Array<string>)
        .reduce(
            (acc, imageUrl) => `${acc}|${imageUrl}`,
            ""
        ).slice(1);
    url.searchParams.append("titles", drinksParamValue);

    console.log("Fetching data from: ", url.toString());
    const result = await fetch<'application/json'>(url.toString(), {
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
    const pages = parsedResult?.query?.pages;

    if (!pages) {
        throw new Error("Unexpected result: " + result.body.content);
    }

    if (Object.entries(pages).length !== drinks.filter(it => !!it.image).length) {
        console.log("Warning: Length mismatch", Object.entries(pages).length, drinks.filter(it => !!it.image).length);
    }

    let res: { [K in typeof drinks[number]['name']]: ImageInfo } = {} as any;
    for (let it of Object.values(pages)) {
        const page = it as Partial<WikimediaPageInfo>;
        const imageInfo = page?.imageinfo?.[0];

        if (!imageInfo) {
            throw new Error("invalid image info entry");
        }

        const descriptionUrl = new URL(imageInfo.descriptionurl);
        const matchInfo = descriptionUrl.pathname.match(/\/wiki\/File:(.+\.\w{1,3})/);

        if (matchInfo === null) {
            console.log("Warning: Image URL does not match the expected pattern", descriptionUrl);
            return null;
        }

        const decodedDescriptionUrl = "https://commons.wikimedia.org/wiki/File:" + decodeURIComponent(matchInfo[1]);

        const drink = drinks.find(it => it.image === decodedDescriptionUrl) as typeof drinks[number] | undefined;
        if (!drink) {
            console.error("Couldn't map image url " + decodedDescriptionUrl + " to drink");
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
            console.error("Image information is incomplete");
            continue;
        }

        res[drink.name as typeof drinks[number]['name']] = assembledImageInfo;
    }

    return res;
}



// https://www.wikidata.org/w/api.php?action=query&format=json&prop=imageinfo&titles=File%3ATschunk_cropped.jpg|File:7_and_7,_Macaroni_Grill,_Dunwoody_GA.jpg&iiprop=url|mime|size&iiurlwidth=300&iiurlheight=300

