import React, { useState, useEffect } from 'react';
import { remindersAPI } from '../api';
import { X, Cake, Flame, Star, Calendar } from 'lucide-react';

const ICONS = { birthday: '🎂', yahrzeit: '🕯️', custom: '⭐', event: '📅', anniversary: '💍' };
const TYPE_HE = { birthday: 'יום הולדת', yahrzeit: 'יארצייט', custom: 'תזכורת', event: 'אירוע', anniversary: 'יום נישואין' };

export default function DailyPopup() {
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('popup_dismissed_' + new Date().toDateString());
    if (dismissed) return;

    remindersAPI.getToday().then(r => {
      if (r.data && r.data.length > 0) {
        setItems(r.data);
        setShow(true);
      }
    }).catch(() => {});
  }, []);

  const close = () => {
    setShow(false);
    sessionStorage.setItem('popup_dismissed_' + new Date().toDateString(), 'true');
  };

  if (!show || items.length === 0) return null;

  const today = items.filter(i => {
    const d = new Date(i.reminder_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });
  const upcoming = items.filter(i => !today.includes(i));

  return (
    <div className="popup-overlay" onClick={close}>
      <div className="popup" onClick={e => e.stopPropagation()}>
        <button onClick={close} style={{ position: 'absolute', top: 12, left: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🕎</div>
        <h2>תזכורות להיום</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
          {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {today.length > 0 && (
          <div className="popup-items">
            <h3 style={{ fontSize: 14, color: '#ef4444', marginBottom: 8 }}>📌 היום</h3>
            {today.map(item => (
              <div key={item.id} className={`popup-item ${item.reminder_type}`}>
                <span className="popup-item-icon">{ICONS[item.reminder_type] || '📌'}</span>
                <div className="popup-item-text">
                  <h4>{item.title}</h4>
                  <p>{item.hebrew_date && `${item.hebrew_date} · `}{TYPE_HE[item.reminder_type]}{item.first_name ? ` · ${item.first_name} ${item.last_name}` : ''}</p>
                  {item.description && <p style={{ marginTop: 4 }}>{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="popup-items">
            <h3 style={{ fontSize: 14, color: '#f59e0b', marginBottom: 8 }}>📅 בימים הקרובים</h3>
            {upcoming.slice(0, 5).map(item => (
              <div key={item.id} className={`popup-item ${item.reminder_type}`}>
                <span className="popup-item-icon">{ICONS[item.reminder_type] || '📌'}</span>
                <div className="popup-item-text">
                  <h4>{item.title}</h4>
                  <p>{item.hebrew_date && `${item.hebrew_date} · `}{new Date(item.reminder_date).toLocaleDateString('he-IL')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-accent" onClick={close} style={{ marginTop: 12, padding: '10px 32px', fontSize: 15 }}>הבנתי, תודה!</button>
      </div>
    </div>
  );
}
