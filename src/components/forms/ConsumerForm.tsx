"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEligibilityStore } from "@/store/eligibility-store";

export default function ConsumerForm() {
  const router = useRouter();

  const setConsumerDetails = useEligibilityStore((state) => state.setConsumerDetails);

  const [consumerNumber, setConsumerNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (consumerNumber.length !== 13) {
      alert("Consumer number must be 13 digits");
      return;
    }

    if (mobileNumber.length !== 10) {
      alert("Mobile number must be 10 digits");
      return;
    }
    setConsumerDetails(consumerNumber, mobileNumber);

    router.push("/verify");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div>
        <label className="block mb-2 text-sm font-medium">
          Consumer Number
        </label>

        <input
          type="text"
          value={consumerNumber}
          onChange={(e) =>
            setConsumerNumber(e.target.value.replace(/\D/g, ""))
          }
          maxLength={13}
          className="w-full rounded-lg border p-3"
          placeholder="1145668028516"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">
          Registered Mobile Number
        </label>

        <input
          type="text"
          value={mobileNumber}
          onChange={(e) =>
            setMobileNumber(e.target.value.replace(/\D/g, ""))
          }
          maxLength={10}
          className="w-full rounded-lg border p-3"
          placeholder="99xxxxxx10"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-black text-white py-3"
      >
        Check Eligibility
      </button>
    </form>
  );
}