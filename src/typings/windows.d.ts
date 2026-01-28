declare global {
    // TODO: actual classes
    class Window_Base {
        /** Activates window to allow events */
        activate(): void;
        /** DEactivates window preventing further events to happen */
        deactivate(): void;
        /** Measures text width */
        textWidth(text): number;
        /** Draws text on window */
        drawText(text: string, x: number, y: number, maxWidth: number, align: "left" | "right" | "center"): void;
        /** Draws text on window with codes support */
        drawTextEx(text: string, x: number, y: number): void;
    }
    
    /** Selectable window */
    class Window_Selectable extends Window_Base {
        constructor(x: number, y: number, width: number, height: number);

        // TODO: currently unused by loader, not documenting
        cursorFixed(): boolean;
        setCursorFixed(cursorFixed: boolean): void;
        cursorAll(): boolean;
        setCursorAll(cursorAll: boolean): void;
        spacing(): number;
        itemWidth(): number;
        itemHeight(): number;
        maxRows(): number;
        deselect(): void;
        reselect(): void;
        row(): number;
        topRow(): number;
        setTopRow(row: number): void;
        resetScroll(): void;
        maxPageItems(): number;
        isHorizontal(): boolean;
        // TODO: finish when needed
        
        /**
         * Redraws item
         * @param index \# of item
         */
        redrawItem(index: number): void;
        /** Redraws currently processed item */
        redrawCurrentItem(): void;
        /** Max rows per page */
        maxPageRows(): number;
        /** True if current item is enabled */
        isCurrentItemEnabled(): boolean;
        /** Draws all items on window */
        drawAllItems(): void;
        /** Draws item with specified \# on window */
        drawItem(index: number): void;
        /** Redraws all content on screen */
        refresh(): void;
        /**
         * Handles a window event
         * @param symbol Event Name
         * @param method Handler
         */
        setHandler(symbol: string, method: () => void): void;
        /**
         * Selects item
         * @param index \# of item
         */
        select(index: number): void;
        /** @inheritdoc This one also reselects item on list */
        activate(): void;
        /** @inheritdoc This one also deselects item from list */
        deactivate(): void;
        /** How many columns does window have? */
        maxCols(): number;
        /** How many items are in window? */
        maxItems(): number;
        /** \# of currently processed item */
        index(): number;
        /** Height of one text line (px) */
        lineHeight(): number;
        /**
         * Height of item
         * @param index \# of item
         */
        itemHeight(index: number): number;
        /**
         * Makes item look grayed out
         * @param enabled Is item enabled?
         */
        changePaintOpacity(enabled: boolean): void;
        /**
         * Rectangle of item
         * @param index \# of item
         */
        itemRect(index: number): Rectangle
    };
}

export {}