import { messy } from '@get-me-drunk/common';
import { useState } from "react";
import "./MessyButton.css";

const messySession = messy.startMessy();

export function MessyButton({ recipe }: { recipe: messy.types.Recipe }) {
    const [state, setState] = useState<"pending" | "loading" | "done" | "abort">("pending");

    async function run() {
        setState("loading");
        await messySession.onReady;
        const result = await messySession.run({
            recipe
        });
        setState(result.state);
    }

    return <button className="messy-button" onClick={run}>
        {state === "pending" && "Mit Messy backen"}
        {state === "loading" && "lädt"}
        {state === "done" && "Mit Messy backen"}
        {state === "abort" && "Huch?"}
    </button>;
}