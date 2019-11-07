import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

const Loading = () => {
  let history = useHistory();

  useEffect(() => {
    setTimeout(() => {
      history.push('/tipsmap');
    }, 2000);
  }, []);

  return <div>Loading</div>;
};

export default Loading;
