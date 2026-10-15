import path from "node:path";

import { config } from "dotenv";

// 레포 루트 .env 를 읽는다. DB 클라이언트보다 먼저 import 되어야 한다.
config({ path: path.resolve(import.meta.dirname, "../../../.env"), quiet: true });
