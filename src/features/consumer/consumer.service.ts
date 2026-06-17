// import { Consumer } from "@/features/consumer/consumer.types";
// import { mockConsumer } from "@/lib/mock";

// export const KsebService = {
//   /**
//    * Fetches consumer details by consumer number and mobile.
//    * TODO: Replace mock with real KSEB API integration.
//    */
//   async getConsumerDetails(
//     consumerNumber: string,
//     mobile: string
//   ): Promise<Consumer | null> {
//     if (
//       consumerNumber === mockConsumer.consumerNumber &&
//       mobile === mockConsumer.mobile
//     ) {
//       return mockConsumer;
//     }
//     return null;
//   },
// };


import { MOCK_CONSUMERS } from "./consumer.mock";
import { Consumer } from "./consumer.types";

export async function verifyConsumer(
  consumerNumber: string,
  mobileNumber: string
): Promise<Consumer> {
  await new Promise((resolve) =>
    setTimeout(resolve, 1000)
  );

  const consumer = MOCK_CONSUMERS.find(
    (item) =>
      item.consumerNumber === consumerNumber &&
      item.mobile === mobileNumber
  );

  if (!consumer) {
    throw new Error(
      "Consumer number or mobile number is invalid"
    );
  }

  return consumer;
}