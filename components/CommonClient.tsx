"use client";

import { useEffect } from "react";

const CommonClient = () => {
  useEffect(() => {
    const initializeMockServiceWorker = async () => {
      if (
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "production"
      ) {
        const enableMocking = async () => {
          const { worker } = await import("@/mocks/browser");
          console.log("worker", worker);
          await worker.start({
            onUnhandledRequest: "bypass",
            serviceWorker: {
              url: "/mockServiceWorker.js",
            },
          });
        };

        await enableMocking().catch((error) => console.log(error));
      }
    };

    initializeMockServiceWorker();
  }, []);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
};

export default CommonClient;
