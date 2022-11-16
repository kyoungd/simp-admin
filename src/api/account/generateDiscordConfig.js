const _ = require('lodash');
const moment = require('moment');
const GenerateEvents = require('./generateSchedule');

function createDiscordRoomJson(accounts, prices, techniques, subscriptions) {
    const subscription1 = [];
    for (const row of subscriptions.data) {
        const { customer, status } = row;
        const { price } = row.items.data[0];
        subscription1.push({ customer, priceId: price.id, status });
    }

    const priceList = [];
    for (const row of prices.data) {
        priceList.push({ priceId: row.id, name: row.product.name, livemode: row.livemode });
    }

    const subscription2 = [];
    for (const row of subscription1) {
        const channel = techniques.find(tech => tech.stripePriceId === row.priceId);
        const { scheduleEvent } = channel;
        const { email, displayName, id } = channel.owner;
        if (channel) {
            subscription2.push({ 
                ...row, 
                name: channel.name, 
                email, displayName, 
                channelLeaderId: id, 
            });
        }
    }

    const subscription3 = [];
    for (const row of subscription2) {
        const account = accounts.find(acc => acc.stripeId === row.customer);
        if (account) {
            const { discordId } = account;
            if (discordId)
                subscription3.push({ ...row, discordId });
        }
    }

    const subscription4 = [];
    for (const row of subscription3) {
        const account = accounts.find(acc => acc.user.id === row.channelLeaderId);
        if (account) {
            const { discordId } = account;
            if (discordId)
                subscription4.push({ ...row, leaderDiscordId: discordId });
        }
    }

    const subscription5 = _.groupBy(subscription4, 'priceId');
    const discordRooms = [];
    for (const [priceId, rows] of Object.entries(subscription5)) {
        const channel = techniques.find(tech => tech.stripePriceId === priceId);
        const generator = new GenerateEvents(null, null, []);
        const schedules = generator.GetEventForDate(channel.scheduleEvent, moment());
        const leaderDiscordId = rows[0].leaderDiscordId;
        const channelName = rows[0].name;
        const students = [];
        for (const row of rows) {
            students.push(row.discordId);
        }
        discordRooms.push({
            id: priceId,
            leader: leaderDiscordId,
            name: channelName,
            voice_channel: null,
            text_channel: null,
            category_channel: null,
            notifications: schedules.map(sch => (`${sch.start} to ${sch.end}`)),
            students });
    }
    return discordRooms;
}

function mergeChannelResult(accounts, channel, subscriptions, techniques) {
    const result = {
        channelId: channel.id,
        room: channel.name,
        summary: channel.summary,
        stripePriceId: channel.stripePriceId,
    };
    const customers = _.map(subscriptions.data, 'customer');
    const students = accounts.map(account => {
        if (customers.includes(account.stripeId)) {
            return { username: account.user.username, email: account.user.email, displayName: account.user.displayName };
        }
    });
    result.students = students;
    console.log(result);
    return result;
}

module.exports = { createDiscordRoomJson, mergeChannelResult };