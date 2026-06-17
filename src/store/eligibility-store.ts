import { create } from "zustand";

import { Consumer } from "@/features/consumer/consumer.types";
import { Transformer } from "@/features/transformer/transformer.types";
import { CapacityResponse } from "@/features/solar/solar.types";

export interface EligibilityState {
  // verification step
  consumerNumber: string;
  mobileNumber: string;

  captchaId: string | null;
  captchaCode: string;

  // fetched data
  consumer: Consumer | null;
  transformer: Transformer | null;
  capacity: CapacityResponse | null;

  // ui state
  loading: boolean;
  error: string | null;

  // consumer data
  setConsumerDetails: (
    consumerNumber: string,
    mobileNumber: string
  ) => void;

  // actions
  setCaptcha: (
    captchaId: string,
    captchaCode: string
  ) => void;

  setConsumer: (
    consumer: Consumer
  ) => void;

  setTransformer: (
    transformer: Transformer
  ) => void;

  setCapacity: (
    capacity: CapacityResponse
  ) => void;

  setLoading: (
    loading: boolean
  ) => void;

  setError: (
    error: string | null
  ) => void;

  reset: () => void;
}

export const useEligibilityStore =
  create<EligibilityState>((set) => ({
    consumerNumber: "",
    mobileNumber: "",

    captchaId: null,
    captchaCode: "",

    consumer: null,
    transformer: null,
    capacity: null,

    loading: false,
    error: null,

    setConsumerDetails: (consumerNumber, mobileNumber) =>
      set({
        consumerNumber,
        mobileNumber,
      }),

    setCaptcha: (captchaId, captchaCode) =>
      set({
        captchaId,
        captchaCode,
      }),

    setConsumer: (consumer) =>
      set({
        consumer,
      }),

    setTransformer: (transformer) =>
      set({
        transformer,
      }),

    setCapacity: (capacity) =>
      set({
        capacity,
      }),

    setLoading: (loading) =>
      set({
        loading,
      }),

    setError: (error) =>
      set({
        error,
      }),

    reset: () =>
      set({
        consumerNumber: "",
        mobileNumber: "",
        captchaId: null,
        captchaCode: "",
        consumer: null,
        transformer: null,
        capacity: null,
        loading: false,
        error: null,
      }),
  }));