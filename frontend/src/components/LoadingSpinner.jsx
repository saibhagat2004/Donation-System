// eslint-disable-next-line react/prop-types
import React from "react";
const LoadingSpinner = ({size}) => {
	const sizeClass = `loading-${size}`;

	return <span className={`loading loading-spinner ${sizeClass}`} />;
};
export default LoadingSpinner;