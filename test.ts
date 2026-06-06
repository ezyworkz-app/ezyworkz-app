import { getShopServiceById } from "./src/lib/actions/shops";

async function test() {
    const res = await getShopServiceById("shopsvc_xxx", "shop_xxx"); // Wait, I don't know the IDs.
}
