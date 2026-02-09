import { dayjsArgentina, nowArgentina } from './dateTimeUtils';

export function filterTurns (myTurns: any, statusFilter: any, familyFilter: any) {
    return myTurns.filter(
      (turn: any) => {
        let matchesStatus = true;
        if (statusFilter) {
          matchesStatus = turn.status === statusFilter;
        }
        return matchesStatus;
    })
    .filter(
      (turn: any) => {
        let matchesFamily = true;
        if (familyFilter) {
          if (familyFilter === 'MYSELF') {
             matchesFamily = !turn.familyMemberId;
          } else {
             matchesFamily = turn.familyMemberId === familyFilter;
          }
        }
        return matchesFamily;
    })
    .sort((a: any, b: any) => {
      const getStatusPriority = (turn: any) => {
        const isPast = dayjsArgentina(turn.scheduledAt).isBefore(nowArgentina());
        
        if (turn.status === 'SCHEDULED') {
          return isPast ? 2 : 1;
        } else if (turn.status === 'CANCELED') {
          return 3;
        }
        return 4;
      };
      
      const statusComparison = getStatusPriority(a) - getStatusPriority(b);
      
      if (statusComparison !== 0) {
        return statusComparison;
      }
      return dayjsArgentina(a.scheduledAt).valueOf() - dayjsArgentina(b.scheduledAt).valueOf();
    })
}

export function turnsOfTheMonth (myTurns: any) {
    const currentMonth = nowArgentina().month();
    const currentYear = nowArgentina().year();
    const currentDay = nowArgentina().date();
    
    return myTurns.filter((turn: any) => {
      const turnDate = dayjsArgentina(turn.scheduledAt);
      const isCurrentMonth = turnDate.month() === currentMonth && turnDate.year() === currentYear;
      const isPast = turnDate.date() <= currentDay;
      
      return isCurrentMonth && isPast && turn.status != 'CANCELED';
    }).length;
}

export function upComingTurns (myTurns: any) {
    const now = nowArgentina();
    
    return myTurns.filter((turn: any) => {
      const turnDate = dayjsArgentina(turn.scheduledAt);
      const isUpcoming = turnDate.isAfter(now);
      const isScheduled = turn.status === 'SCHEDULED';
      
      return isUpcoming && isScheduled;
    }).length;
}


export function allPastTurnsThisMonth (myTurns: any) {
    const currentMonth = nowArgentina().month();
    const currentYear = nowArgentina().year();
    const currentDay = nowArgentina().date();
    
    return myTurns.filter((turn: any) => {
      const turnDate = dayjsArgentina(turn.scheduledAt);
      const isCurrentMonth = turnDate.month() === currentMonth && turnDate.year() === currentYear;
      const isPast = turnDate.date() <= currentDay;
      const isCompleted = turn.status != 'CANCELED';
      
      return isCurrentMonth && isPast && isCompleted ;
    }).length;
}