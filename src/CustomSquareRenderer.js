import React, { forwardRef } from "react";

const CustomSquareRenderer = forwardRef((props, ref) => {
    const { children, square, style, customSquares } = props;
  
    const squareStyle = {
      ...style,
      position: 'relative'  // Ensures child elements with absolute positioning are relative to this square
    };
  
    return (
      <div ref={ref} style={squareStyle}>
        {children}
        {customSquares.includes(square) && (
          <div 
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: '20px',  // Adjust size as needed
              height: '20px',
              //borderRadius: '50%',  // Makes it a circle
              backgroundColor: 'brown'
            }} 
          />
        )}
      </div>
    )
  })

  export default CustomSquareRenderer;