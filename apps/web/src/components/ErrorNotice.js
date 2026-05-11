import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const ErrorNotice = ({ message }) => {
    return (_jsxs("div", { className: "error-notice", role: "alert", children: [_jsx("strong", { children: "Er ging iets mis." }), _jsx("p", { children: message })] }));
};
