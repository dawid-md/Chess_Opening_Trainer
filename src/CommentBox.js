import { useState } from "react";

export default function CommentBox({comment, setComment}){
    return (
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        style={{ width: 300, height: 200 }}
      />
    );
}