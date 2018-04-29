declare module "url-glob" {
    class UrlGlob {
        constructor(pattern: string);
        match(url: string): boolean;
    }

    export = UrlGlob;
}