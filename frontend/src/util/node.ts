const NODE_TYPES = {
    'ELEMENT_NODE': 1,
    'ATTRIBUTE_NODE': 2,
    'TEXT_NODE': 3,
    'CDATA_SECTION_NODE': 4,
    'PROCESSING_INSTRUCTION_NODE': 7,
    'COMMENT_NODE': 8,
    'DOCUMENT_NODE': 9,
    'DOCUMENT_TYPE_NODE': 10,
    'DOCUMENT_FRAGMENT_NODE': 11
};

type NodeType = keyof typeof NODE_TYPES;

function buildVerifier(type: NodeType): (node: Node) => boolean {
    return it => it.nodeType === NODE_TYPES[type];
}

const VERIFIERS: { [K in keyof Camelize<typeof NODE_TYPES> as `is${Capitalize<K>}`]: (node: Node) => boolean } = {
    isElementNode: buildVerifier('ELEMENT_NODE'),
    isAttributeNode: buildVerifier('ATTRIBUTE_NODE'),
    isTextNode: buildVerifier('TEXT_NODE'),
    isCdataSectionNode: buildVerifier('CDATA_SECTION_NODE'),
    isProcessingInstructionNode: buildVerifier('PROCESSING_INSTRUCTION_NODE'),
    isCommentNode: buildVerifier('COMMENT_NODE'),
    isDocumentNode: buildVerifier('DOCUMENT_NODE'),
    isDocumentTypeNode: buildVerifier('DOCUMENT_TYPE_NODE'),
    isDocumentFragmentNode: buildVerifier('DOCUMENT_FRAGMENT_NODE')
};

export default { ...VERIFIERS };

type Camelize<T> = { [K in keyof T as CamelizeKeyLowercase<K>]: T[K] };

type CamelizeKeyLowercase<T> = T extends string ? CamelizeKeyFirstLetter<Lowercase<T>> : T;

type CamelizeKeyFirstLetter<T> = T extends `${infer C}${infer R}` ? `${C}${CamelizeSingleRemoveUnderscore<R>}` : T;

type CamelizeSingleRemoveUnderscore<T extends string> = 
    T extends `${infer C}_${infer R}` ? `${C}${Capitalize<CamelizeSingleRemoveUnderscore<R>>}` : T;

