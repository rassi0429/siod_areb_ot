import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmbedBuilder, Collection, Role, GuildMember, User, TextChannel } from 'discord.js';

// Mock discord.js
vi.mock('discord.js', async () => {
  const actual = await vi.importActual('discord.js');
  return {
    ...actual,
    Client: vi.fn().mockImplementation(() => ({
      once: vi.fn(),
      on: vi.fn(),
      login: vi.fn(),
      channels: {
        cache: {
          get: vi.fn(),
        },
      },
    })),
  };
});

describe('EmbedBuilder', () => {
  it('should create role delete embed correctly', () => {
    const embed = new EmbedBuilder()
      .setTitle('🗑️ ロールが削除されました')
      .setColor(0xff0000)
      .addFields(
        { name: 'ロール名', value: 'TestRole', inline: true },
        { name: 'ロールID', value: '123456789', inline: true },
        { name: '実行者', value: 'TestUser (987654321)', inline: false }
      )
      .setTimestamp();

    expect(embed.data.title).toBe('🗑️ ロールが削除されました');
    expect(embed.data.color).toBe(0xff0000);
    expect(embed.data.fields).toHaveLength(3);
    expect(embed.data.fields?.[0].name).toBe('ロール名');
    expect(embed.data.fields?.[0].value).toBe('TestRole');
  });

  it('should create role update embed correctly', () => {
    const embed = new EmbedBuilder()
      .setTitle('✏️ ロール名が変更されました')
      .setColor(0xffff00)
      .addFields(
        { name: '変更前', value: 'OldRole', inline: true },
        { name: '変更後', value: 'NewRole', inline: true },
        { name: 'ロールID', value: '123456789', inline: false },
        { name: '実行者', value: '不明', inline: false }
      )
      .setTimestamp();

    expect(embed.data.title).toBe('✏️ ロール名が変更されました');
    expect(embed.data.fields).toHaveLength(4);
    expect(embed.data.fields?.[0].value).toBe('OldRole');
    expect(embed.data.fields?.[1].value).toBe('NewRole');
  });

  it('should create role granted embed correctly', () => {
    const embed = new EmbedBuilder()
      .setTitle('✅ ロールが付与されました')
      .setColor(0x00ff00)
      .addFields(
        { name: 'ユーザー', value: 'TestUser#1234', inline: true },
        { name: 'ロール', value: 'MemberRole', inline: true },
        { name: '実行者', value: 'Admin#0001', inline: false }
      )
      .setTimestamp();

    expect(embed.data.title).toBe('✅ ロールが付与されました');
    expect(embed.data.color).toBe(0x00ff00);
    expect(embed.data.fields?.[0].value).toBe('TestUser#1234');
  });

  it('should create role removed embed correctly', () => {
    const embed = new EmbedBuilder()
      .setTitle('❌ ロールが剥奪されました')
      .setColor(0xff0000)
      .addFields(
        { name: 'ユーザー', value: 'TestUser#1234', inline: true },
        { name: 'ロール', value: 'MemberRole', inline: true },
        { name: '実行者', value: '不明', inline: false }
      )
      .setTimestamp();

    expect(embed.data.title).toBe('❌ ロールが剥奪されました');
    expect(embed.data.fields?.[2].value).toBe('不明');
  });
});

describe('Role diff logic', () => {
  it('should detect added roles', () => {
    const oldRoles = new Collection<string, { id: string; name: string }>();
    oldRoles.set('1', { id: '1', name: 'Role1' });

    const newRoles = new Collection<string, { id: string; name: string }>();
    newRoles.set('1', { id: '1', name: 'Role1' });
    newRoles.set('2', { id: '2', name: 'Role2' });

    const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id));
    const removedRoles = oldRoles.filter((role) => !newRoles.has(role.id));

    expect(addedRoles.size).toBe(1);
    expect(addedRoles.get('2')?.name).toBe('Role2');
    expect(removedRoles.size).toBe(0);
  });

  it('should detect removed roles', () => {
    const oldRoles = new Collection<string, { id: string; name: string }>();
    oldRoles.set('1', { id: '1', name: 'Role1' });
    oldRoles.set('2', { id: '2', name: 'Role2' });

    const newRoles = new Collection<string, { id: string; name: string }>();
    newRoles.set('1', { id: '1', name: 'Role1' });

    const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id));
    const removedRoles = oldRoles.filter((role) => !newRoles.has(role.id));

    expect(addedRoles.size).toBe(0);
    expect(removedRoles.size).toBe(1);
    expect(removedRoles.get('2')?.name).toBe('Role2');
  });

  it('should handle no changes', () => {
    const oldRoles = new Collection<string, { id: string; name: string }>();
    oldRoles.set('1', { id: '1', name: 'Role1' });

    const newRoles = new Collection<string, { id: string; name: string }>();
    newRoles.set('1', { id: '1', name: 'Role1' });

    const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id));
    const removedRoles = oldRoles.filter((role) => !newRoles.has(role.id));

    expect(addedRoles.size).toBe(0);
    expect(removedRoles.size).toBe(0);
  });
});
