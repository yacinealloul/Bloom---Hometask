import { redirect } from "next/navigation";

export default async function ChatIndex() {
    redirect("/chat/new");
}


