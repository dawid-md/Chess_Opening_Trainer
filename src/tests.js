let pgnTree = {
    move: "startingPosition",
    children: [
      {
        move: "e4",
        children: [
          {
            move: "e5",
            children: [
              {
                move: "nf3",
                children: []
              },
              {
                move: "d4",
                children: []
              }
            ]
          }
        ]
      }
    ]
}








// let ax = ["e4", "e5",                                       //e5 is main line
//                 ["nf6", "nf3", "d6", ["c6", "d3"]],         //first variant - instead of e5
//                 ["c5", "nf3"],                              //second variant - instead of e5
//                     "d3"]                                   //continuation of main line - e4, e5, d3


//teraz wykonujac ruch trzeba na podstawie jego current index sprawdzic czy istnieje juz ruch ktory ma ten sam current index i ten sam fen
//jesli tak - to nie tworzymy nowego ruchu w tablicy moves tylko zwiększamy currentindex lub 
//jesli ten ruch jest istniejacym variantem to dodajemy nowy element do currentIndex (1) i to on jest naszym currentIndexem teraz.
    //oznacza to, że nasz currentIndex wygląda tak: [3,1]   -- trzeba sie zastanowic czy variant we variancie powinien wygenerowac nowy index czy nowy array z indexem
//jesli main line juz istnieje i jest rozny od aktualnego ruchu to tworzymy nowy variant

//console.log(ax);

// if((moves.length > currentMoveIndex[0] && variation.length == 0) || variation.length > 0){
//     let foundMatch = false
//     let j = currentMoveIndex[currentMoveIndex.length-1]

//     console.log(result);

//     // If the first item is a string, compare it with result.san
//     //if (typeof moves[j] === 'string') {
//       foundMatch = moves[j].after === result.after;
//       console.log(foundMatch);
//       j++;
//     //}

//     // If first comparison was not a match, continue checking the next items (they are arrays)
//     while(!foundMatch && j < moves.length && Array.isArray(moves[j])) {
//       if(moves[j].length > 0 && moves[j][0] === result.san) {
//           foundMatch = true;
//       }
//       j++;
//     }

//     if (!foundMatch && variation.length == 0) {
//       setVariation([...variation, result])  //this line only executes if no match is found
//       setcurrentMoveIndex(prev => [...prev, 1])
//     }
//     else if (!foundMatch && currentMoveIndex[currentMoveIndex.length - 1] == variation.length) {
//       setVariation([...variation, result])
//       setcurrentMoveIndex(prev => {
//         let newState = [...prev];
//         newState[newState.length - 1] = newState[newState.length - 1] + 1
//         return newState;
//       })
//     }
//     else{
//       console.log("length of moves " + moves.length);
//     }
//   }

//   else if (currentMoveIndex.length > 1) {
//     if(currentMoveIndex[currentMoveIndex.length - 1] < variation.length){
//       setVariation(prev => [...prev, [result]])
//     }
//   }

//   else{
//     setMoves([...moves, result])
//     setcurrentMoveIndex(prev => {
//       let newState = [...prev];
//       newState[newState.length - 1] = newState[newState.length - 1] + 1
//       return newState;
//     })
//   } 

// //moveback

// if(variation.length > 0 && currentMoveIndex[currentMoveIndex.length -1] == 1){  //it means zero before state is updated from 1 to 0
//     const newMoves = moves
//     newMoves.splice(currentMoveIndex[0]+1, 0, variation)
//     setMoves(newMoves)
//     setVariation([])
//     setcurrentMoveIndex(prev => {
//       let newState = [...prev]
//       newState.splice(-1,1)
//       return newState
//     })
//   }

//   else {
//     setcurrentMoveIndex(prev => {
//       let newState = [...prev]
//       newState[newState.length - 1] = newState[newState.length - 1] - 1
//       return newState
//     })
//   }