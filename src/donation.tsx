import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const MoneyInput = ({ money, onChange }: { money: string; onChange: (val: string) => void }) => (
    <div className="input-group unit-input">
        <input 
            type="number" 
            value={money} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder="Tell me, how much money did you donate?"
        />
        <span className="unit-tag">million USD</span>
    </div>
);

const NicknameInput = ({ nickname, onChange }: { nickname: string; onChange: (val: string) => void }) => (
    <div className="input-group">
        <input 
            type="text" 
            value={nickname} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder="Consider leaving your nickname?"
        />
    </div>
);

const PageConfirm = ({ money, nickname }: { money: string; nickname: string }) => {
    const handleConfirm = () => {
        const playerInfo = JSON.parse(localStorage.getItem('playerInfo') || '{}');
        playerInfo.money = money;
        playerInfo.nickname = nickname;
        localStorage.setItem('playerInfo', JSON.stringify(playerInfo));
        // alert('Saved!');
        window.location.href = './confirm.html';
    };

    return (
        <div className="input-group" style={{ justifyContent: 'center' }}>
            <button className="confirm-btn" onClick={handleConfirm}>Confirm</button>
        </div>
    );
};

const App = () => {
    const [money, setMoney] = useState('');
    const [nickname, setNickname] = useState('');

    return (
        <div>
            <MoneyInput money={money} onChange={setMoney} />
            <NicknameInput nickname={nickname} onChange={setNickname} />
            <PageConfirm money={money} nickname={nickname} />
        </div>
    );
};

const container = document.getElementById('donation-root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
