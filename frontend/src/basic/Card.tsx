import * as React from "react";
import "./Card.css";

export function Card({ children, onClick }: React.PropsWithChildren<{ onClick?: () => void; }>) {
    return <div className="basic-card" onClick={onClick}>{children}</div>
}

Card.Title = function({ name }: { name: string }) {
    return <div className="basic-card-title">{name}</div>;
};

Card.Content = function({ title, children }: React.PropsWithChildren<{ title: string }>) {
    return <div className="basic-card-content">
        <div className="basic-card-content__title">{title}</div>
        <div className="basic-card-content__content">
            {children}
        </div>
    </div>;
};

Card.Image = function({ src }: { src: string }) {
    return <div className="basic-card-image__container">
        <img src={src} alt="cocktail" className="basic-card-image" />
    </div>;
}

/* Wrapper for a Card with a Decorator in front */
Card.Container = function({ children }: React.PropsWithChildren<{}>) {
    return <div className="basic-card-container">
        {children}
    </div>;
};

Card.Decorator = function({ content }: { content: string }) {
    return <div className="basic-card-decorator">{content}</div>;
};

