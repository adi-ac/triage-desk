import type { Metadata } from "next";
import { TypeSpecimen } from "./type-specimen";

export const metadata: Metadata = {
  title: "Type scale · Triage Desk",
};

export default function Page() {
  return <TypeSpecimen />;
}
