import React from 'react';
import './ConnectBankButton.css';

const ConnectBankButton = ({ onClick }) => {
  return (
    <button className="connect-bank-button" onClick={onClick}>
      Подключить банк
    </button>
  );
};

export default ConnectBankButton;