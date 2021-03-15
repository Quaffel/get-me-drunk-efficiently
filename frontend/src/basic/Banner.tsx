import * as React from "react";
import "./Banner.css";

export const Banner = {
    Warning({ title, text }: { title: string, text: string }) {
        return <div className="basic-banner__warning">
            <div className="basic-banner-title">{title}</div>
            <div className="basic-banner-text">{text}</div>
        </div>;
    }
};