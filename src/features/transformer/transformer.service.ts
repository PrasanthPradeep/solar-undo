// import { Transformer } from "@/features/transformer/transformer.types";
// import { mockTransformer } from "@/lib/mock";

// export const TransformerService = {
//   /**
//    * Fetches transformer/DTR details by name.
//    * TODO: Replace mock with real KSEB transformer data.
//    */
//   async getTransformerByName(name: string): Promise<Transformer | null> {
//     if (name === mockTransformer.name) {
//       return {
//         name: mockTransformer.name,
//         capacity: mockTransformer.capacity,
//         availableSolar: mockTransformer.availableSolar,
//         officeCode: mockTransformer.officeCode,
//       };
//     }
//     return null;
//   },
// };


import { MOCK_TRANSFORMERS } from "./transformer.mock";
import { Transformer } from "./transformer.types";

export async function getTransformer(
  transformerName: string
): Promise<Transformer> {
  await new Promise((resolve) =>
    setTimeout(resolve, 800)
  );

  const transformer =
    MOCK_TRANSFORMERS.find(
      (item) =>
        item.name === transformerName
    );

  if (!transformer) {
    throw new Error(
      "Transformer not found"
    );
  }

  return transformer;
}