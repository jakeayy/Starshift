declare global {
    class Rectangle extends PIXI.Rectangle {
        width: number
        height: number
        x: number
        y: number
        
        /** Zeroed rectangle */
        private static emptyRectangle: Rectangle;
    }
    
    // TODO: actual classes
}

export {}