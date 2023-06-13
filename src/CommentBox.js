export default function CommentBox({comment, setComment, position}){

  const changeComment = (fieldValue) => {
    setComment({
      position: position,
      comment: fieldValue
    });
  }

  return (
    <textarea
      value={comment.comment}
      onChange={e => changeComment(e.target.value)}
      style={{ width: 400, height: 100 }}
    />
  )
}