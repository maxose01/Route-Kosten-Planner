interface ErrorNoticeProps {
  message: string;
}

export const ErrorNotice = ({ message }: ErrorNoticeProps) => {
  return (
    <div className="error-notice" role="alert">
      <strong>Er ging iets mis.</strong>
      <p>{message}</p>
    </div>
  );
};
