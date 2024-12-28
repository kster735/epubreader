export function load({params}) {
    // const book = url.searchParams.get("book");
    const book = params.bookID;
    return {
        book
    }
}