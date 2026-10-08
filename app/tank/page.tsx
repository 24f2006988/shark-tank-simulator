import type { Metadata } from "next";
import { TankLoader } from "./TankLoader";

export const metadata: Metadata = { title: "In the tank" };

export default function TankPage() {
  return <TankLoader />;
}
