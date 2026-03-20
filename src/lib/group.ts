import { Group, GroupMember, UserProfile } from '@/types';

export function generateGroupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createGroup(profile: UserProfile): Group {
  const member: GroupMember = {
    userId: profile.id,
    name: profile.name,
    services: profile.services,
  };
  return {
    code: generateGroupCode(),
    members: [member],
    createdAt: new Date().toISOString(),
  };
}

export function joinGroup(existingGroup: Group, profile: UserProfile): Group {
  const filteredMembers = existingGroup.members.filter(m => m.userId !== profile.id);
  const newMember: GroupMember = {
    userId: profile.id,
    name: profile.name,
    services: profile.services,
  };
  return {
    ...existingGroup,
    members: [...filteredMembers, newMember],
  };
}

export function getOverlappingServices(group: Group): number[] {
  if (group.members.length === 0) return [];
  const memberServiceIds = group.members.map(member =>
    member.services.map(s => s.watchmodeSourceId)
  );
  const first = memberServiceIds[0];
  return first.filter(id =>
    memberServiceIds.every(memberIds => memberIds.includes(id))
  );
}
