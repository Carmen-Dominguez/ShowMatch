'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Group } from '@/types';
import styles from './GroupPanel.module.scss';

export default function GroupPanel() {
  const { profile, group, createNewGroup, joinExistingGroup } = useApp();
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'create' | 'join'>('create');

  async function handleCreate() {
    createNewGroup();
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) {
      setJoinError('Please enter a group code.');
      return;
    }
    const mockGroup: Group = {
      code: joinCode.toUpperCase(),
      members: [],
      createdAt: new Date().toISOString(),
    };
    setJoinError('');
    joinExistingGroup(joinCode.toUpperCase(), mockGroup);
  }

  async function handleCopy() {
    if (!group) return;
    await navigator.clipboard.writeText(group.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (group) {
    return (
      <div className={styles.panel}>
        <div className={styles.groupInfo}>
          <h3 className={styles.sectionTitle}>Your Group</h3>
          <div className={styles.code}>
            <span className={styles.codeText}>{group.code}</span>
            <button className={styles.copyBtn} onClick={handleCopy} type="button">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <p className={styles.hint}>Share this code with your partner</p>
        </div>
        <div className={styles.members}>
          <h4 className={styles.membersTitle}>Members ({group.members.length})</h4>
          {group.members.map(member => (
            <div key={member.userId} className={styles.member}>
              <span className={styles.memberAvatar}>
                {member.name.charAt(0).toUpperCase()}
              </span>
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{member.name}</span>
                <span className={styles.memberServices}>
                  {member.services.map(s => s.logo).join(' ')}
                </span>
              </div>
              {member.userId === profile?.id && (
                <span className={styles.youBadge}>You</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'create' ? styles.activeTab : ''}`}
          onClick={() => setTab('create')}
          type="button"
        >
          Create Group
        </button>
        <button
          className={`${styles.tab} ${tab === 'join' ? styles.activeTab : ''}`}
          onClick={() => setTab('join')}
          type="button"
        >
          Join Group
        </button>
      </div>

      {tab === 'create' ? (
        <div className={styles.createSection}>
          <p className={styles.description}>
            Create a group and share the code with your partner so they can join.
          </p>
          <button className={styles.primaryBtn} onClick={handleCreate} type="button">
            Create New Group
          </button>
        </div>
      ) : (
        <form className={styles.joinSection} onSubmit={handleJoin}>
          <p className={styles.description}>
            Enter the group code your partner shared with you.
          </p>
          <input
            type="text"
            className={styles.codeInput}
            placeholder="Enter group code"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          {joinError && <p className={styles.error}>{joinError}</p>}
          <button className={styles.primaryBtn} type="submit">
            Join Group
          </button>
        </form>
      )}
    </div>
  );
}
