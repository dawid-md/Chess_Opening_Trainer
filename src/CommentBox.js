export default function CommentBox({comment, setComment, position}){

  const changeComment = (fieldValue) => {
    setComment({
      position: position,
      comment: fieldValue,
      commentID: comment.commentID
    });
  }

  return (
    <textarea className="form-control text-white bg-dark" rows="10"
      value={comment?.comment}
      onChange={e => changeComment(e.target.value)}
      style={{ width: 300 }}
    />
  )
}