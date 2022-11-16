const _ = require('lodash');
const moment = require('moment');

class GenerateEvents {
    constructor(resources, templates, events) {
        this.resources = resources;
        this.templates = templates;
        this.events = events;
    }

    getStartSchedule() {
        const oneday = moment().day();  // 0 = Sunday, 1 = Monday, etc.
        const yesterday = moment().add(-oneday, 'days');  // 0
        const startSchedule = yesterday.clone().startOf('day');
        return startSchedule;
    }

    removeOldEvents(events, startSchedule) {
        const removed = events.filter(event => event.start < startSchedule);
        const newEvents = events.filter(event => event.start >= startSchedule);
        return { removed, newEvents };
    }

    addNewEvents(templates, events, startSchedule, numberOfWeeks, maxEvent) {
        const results = [];
        const endSchedule = startSchedule.clone().add(numberOfWeeks, 'weeks');
        const maxEventDate = moment(maxEvent.start).startOf('day');
        let id = maxEvent.id;
        if (endSchedule <= maxEventDate.add(1, 'day')) return events;
        const startDate = maxEventDate.add(1, 'day') > startSchedule ? maxEventDate.add(1, 'day') : startSchedule;
        for (const newDate = startDate; newDate < endSchedule; newDate.add(1, 'day')) {
            for (const template of templates) {
                const dayofweek = newDate.day();
                if (template.days.includes(dayofweek)) {
                    id = id + 1;
                    const newEvent = {
                        id,
                        date: newDate.format('YYYY-MM-DD'),
                        start: moment(`${newDate.format('YYYY-MM-DD')} ${template.start}`).format('YYYY-MM-DD HH:mm:ss'),
                        end: moment(`${newDate.format('YYYY-MM-DD')} ${template.end}`).format('YYYY-MM-DD HH:mm:ss'),
                        resourceId: template.resourceId,
                        title: template.title,
                        bgColor: template.bgColor,
                        showPopover: template.showPopover ? template.showPopover : false,
                        skip: template.skip ? template.skip : false,
                    };
                    results.push(newEvent);
                }
            }
        }
        return results;
    }

    GetEventForDate(events = null, onedate = null) {
        if (!onedate) onedate = moment();
        if (!events) events = this.events;
        const results = events.filter(event => event.date === onedate.format('YYYY-MM-DD'));
        return results;
    }

    GenerateWeeklyEvents(numWeeks) {
        const startSchedule = this.getStartSchedule();
        const maxEvent = !this.events || this.events.length === 0 ? { id: 0, start: startSchedule } : _.maxBy(this.events, 'id');
        const { removed, newEvents } = this.removeOldEvents(this.events, startSchedule);
        const results = this.addNewEvents(this.templates, newEvents, startSchedule, numWeeks, maxEvent);
        return _.concat(newEvents, results);
    }
}

module.exports = GenerateEvents;
