import { useState } from "react";

export default function SimpleModal({ isOpen, onClose, onSave}) {
  const [openingName, setopeningName] = useState("")  //name chosed before saving 
  const [openingColor, setopeningColor] = useState("white")  //name chosed before saving 

  const changeopeningName = (event) => {
    event.preventDefault()
    setopeningName(event.target.value)
  }

  const changeopeningColor = (event) => {
    event.preventDefault()
    setopeningColor(event.target.value)
  }

  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose}>Close</button>
        <div>
          <p>Name</p>
          <input type="text" onChange={changeopeningName} placeholder="Opening Name"/>
          <p>Color</p>
          <select onChange={changeopeningColor}>
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>
        <button onClick={() => onSave(openingName, openingColor)}>Save</button>
      </div>
    </div>
  );
}