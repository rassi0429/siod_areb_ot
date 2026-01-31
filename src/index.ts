import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  AuditLogEvent,
  Events,
  Role,
  GuildMember,
  PartialGuildMember,
  TextChannel,
  User,
  PartialUser,
} from 'discord.js';
import 'dotenv/config';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

// ロールが削除されたとき
client.on(Events.GuildRoleDelete, async (role: Role) => {
  if (!LOG_CHANNEL_ID) return;
  const channel = client.channels.cache.get(LOG_CHANNEL_ID) as TextChannel | undefined;
  if (!channel) return;

  let executor: User | PartialUser | null = null;
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const auditLogs = await role.guild.fetchAuditLogs({
      type: AuditLogEvent.RoleDelete,
      limit: 1,
    });
    const entry = auditLogs.entries.first();
    if (entry && entry.target?.id === role.id) {
      executor = entry.executor;
    }
  } catch (error) {
    console.error('Audit log取得エラー:', error);
  }

  const embed = new EmbedBuilder()
    .setTitle('🗑️ ロールが削除されました')
    .setColor(0xff0000)
    .addFields(
      { name: 'ロール名', value: role.name, inline: true },
      { name: 'ロールID', value: role.id, inline: true },
      { name: '実行者', value: executor ? `${executor.tag} (${executor.id})` : '不明', inline: false }
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] });
});

// ロールが更新されたとき
client.on(Events.GuildRoleUpdate, async (oldRole: Role, newRole: Role) => {
  if (!LOG_CHANNEL_ID) return;
  const channel = client.channels.cache.get(LOG_CHANNEL_ID) as TextChannel | undefined;
  if (!channel) return;

  if (oldRole.name !== newRole.name) {
    let executor: User | PartialUser | null = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const auditLogs = await newRole.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleUpdate,
        limit: 1,
      });
      const entry = auditLogs.entries.first();
      if (entry && entry.target?.id === newRole.id) {
        executor = entry.executor;
      }
    } catch (error) {
      console.error('Audit log取得エラー:', error);
    }

    const embed = new EmbedBuilder()
      .setTitle('✏️ ロール名が変更されました')
      .setColor(newRole.color || 0xffff00)
      .addFields(
        { name: '変更前', value: oldRole.name, inline: true },
        { name: '変更後', value: newRole.name, inline: true },
        { name: 'ロールID', value: newRole.id, inline: false },
        { name: '実行者', value: executor ? `${executor.tag} (${executor.id})` : '不明', inline: false }
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }
});

// メンバーのロールが変更されたとき
client.on(Events.GuildMemberUpdate, async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
  if (!LOG_CHANNEL_ID) return;
  const channel = client.channels.cache.get(LOG_CHANNEL_ID) as TextChannel | undefined;
  if (!channel) return;

  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;

  const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id));
  const removedRoles = oldRoles.filter((role) => !newRoles.has(role.id));

  if (addedRoles.size === 0 && removedRoles.size === 0) return;

  let executor: User | PartialUser | null = null;
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const auditLogs = await newMember.guild.fetchAuditLogs({
      type: AuditLogEvent.MemberRoleUpdate,
      limit: 5,
    });

    const entry = auditLogs.entries.find(
      (e) => e.target?.id === newMember.id && Date.now() - e.createdTimestamp < 5000
    );

    if (entry) {
      executor = entry.executor;
    }
  } catch (error) {
    console.error('Audit log取得エラー:', error);
  }

  const executorText = executor ? `${executor.tag}` : '不明';

  for (const [, role] of addedRoles) {
    const embed = new EmbedBuilder()
      .setTitle('✅ ロールが付与されました')
      .setColor(role.color || 0x00ff00)
      .addFields(
        { name: 'ユーザー', value: `${newMember.user.tag}`, inline: true },
        { name: 'ロール', value: `${role.name}`, inline: true },
        { name: '実行者', value: executorText, inline: false }
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }

  for (const [, role] of removedRoles) {
    const embed = new EmbedBuilder()
      .setTitle('❌ ロールが剥奪されました')
      .setColor(0xff0000)
      .addFields(
        { name: 'ユーザー', value: `${newMember.user.tag}`, inline: true },
        { name: 'ロール', value: `${role.name}`, inline: true },
        { name: '実行者', value: executorText, inline: false }
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }
});

client.login(process.env.DISCORD_TOKEN);
