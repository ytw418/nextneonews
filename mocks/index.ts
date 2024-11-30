import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

const initMocks = async () => {
  if (typeof window === "undefined") {
    const { server } = await import("./server");
    server.listen();
  } else {
    const worker = setupWorker(...handlers);
    await worker.start({
      onUnhandledRequest: "bypass",
    });
  }
};

export default initMocks;
