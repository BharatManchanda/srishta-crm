export function dealToDocument(lead: any): string {
  const lines: string[] = [];

  lines.push("Deal Information");
  lines.push("================");

  return lines.join("\n");

}
export function leadToDocument(lead: any): string {
  const lines: string[] = [];

  lines.push("Lead Information");
  lines.push("================");
  lines.push(`ID: ${lead.id}`);
  lines.push(`Title: ${lead.title ?? "N/A"}`);
  lines.push(`Name: ${lead.name ?? "N/A"}`);
  lines.push(`Email: ${lead.email ?? "N/A"}`);
  lines.push(`Phone: ${lead.phone ?? "N/A"}`);
  lines.push(`Website: ${lead.website ?? "N/A"}`);
  lines.push(`Industry: ${lead.industry ?? "N/A"}`);
  lines.push(`Source: ${lead.source ?? "N/A"}`);
  lines.push(`Status: ${lead.status ?? "N/A"}`);
  lines.push(`Priority: ${lead.priority ?? "N/A"}`);
  lines.push(`Rating: ${lead.rating ?? "N/A"}`);
  lines.push(`Lead Score: ${lead.leadScore ?? "N/A"}`);
  lines.push(`Budget: ${lead.budget ?? "N/A"}`);
  lines.push(`Qualified: ${lead.isQualified ? "Yes" : "No"}`);
  lines.push(`Converted: ${lead.isConverted ? "Yes" : "No"}`);

  if (lead.description) {
    lines.push("");
    lines.push("Description:");
    lines.push(lead.description);
  }

  if (lead.requirement) {
    lines.push("");
    lines.push("Requirement:");
    lines.push(lead.requirement);
  }

  return lines.join("\n");
}

export function contactToDocument(contact: any): string {
  const lines: string[] = [];
  
  lines.push("Contact Information");
  lines.push("================");

  lines.push(`ID: ${contact.id}`);
  lines.push(`Name: ${contact.name}`);

  if (contact.title) {
    lines.push(`Title: ${contact.title}`);
  }

  if (contact.email) {
    lines.push(`Email: ${contact.email}`);
  }

  if (contact.phone) {
    lines.push(`Phone: ${contact.phone}`);
  }

  if (contact.source) {
    lines.push(`Source: ${contact.source}`);
  }

  if (contact.fax) {
    lines.push(`Fax: ${contact.fax}`);
  }

  if (contact.assistant) {
    lines.push(`Assistant: ${contact.assistant}`);
  }

  if (contact.assistantPhone) {
    lines.push(`Assistant Phone: ${contact.assistantPhone}`);
  }

  if (contact.department) {
    lines.push(`Department: ${contact.department}`);
  }

  if (contact.dateOfBirth) {
    lines.push(
      `Date of Birth: ${new Date(contact.dateOfBirth).toISOString().split("T")[0]}`
    );
  }

  if (contact.skypeId) {
    lines.push(`Skype ID: ${contact.skypeId}`);
  }

  if (contact.twitter) {
    lines.push(`Twitter: ${contact.twitter}`);
  }

  if (contact.description) {
    lines.push("");
    lines.push("Description");
    lines.push("-----------");
    lines.push(contact.description);
  }

  if (contact.mailingAddress) {
    lines.push("");
    lines.push("Mailing Address");
    lines.push("----------------");

    const address = [
      contact.mailingAddress.street,
      contact.mailingAddress.city,
      contact.mailingAddress.state,
      contact.mailingAddress.country,
      contact.mailingAddress.zipCode,
    ]
      .filter(Boolean)
      .join(", ");

    if (address) {
      lines.push(address);
    }
  }

  if (contact.otherAddress) {
    lines.push("");
    lines.push("Other Address");
    lines.push("-------------");

    const address = [
      contact.otherAddress.street,
      contact.otherAddress.city,
      contact.otherAddress.state,
      contact.otherAddress.country,
      contact.otherAddress.zipCode,
    ]
      .filter(Boolean)
      .join(", ");

    if (address) {
      lines.push(address);
    }
  }

  if (contact.owner) {
    lines.push("");
    lines.push(`Owner: ${contact.owner.name}`);
    if (contact.owner.email) {
      lines.push(`Owner Email: ${contact.owner.email}`);
    }
  }

  if (contact.createdBy) {
    lines.push("");
    lines.push(`Created By: ${contact.createdBy.name}`);
  }

  lines.push("");
  lines.push(`Created At: ${contact.createdAt}`);
  lines.push(`Updated At: ${contact.updatedAt}`);

  return lines.join("\n");
}


export function accountToDocument(account: any): string {
  const lines: string[] = [];

  lines.push("Account Information");
  lines.push("===================");

  lines.push(`ID: ${account.id}`);
  lines.push(`Account Name: ${account.accountName}`);

  if (account.accountSite) {
    lines.push(`Account Site: ${account.accountSite}`);
  }

  if (account.accountNumber) {
    lines.push(`Account Number: ${account.accountNumber}`);
  }

  if (account.accountType) {
    lines.push(`Account Type: ${account.accountType}`);
  }

  if (account.parentAccount) {
    lines.push(`Parent Account: ${account.parentAccount.accountName}`);
  }

  if (account.industry) {
    lines.push(`Industry: ${account.industry}`);
  }

  if (account.annualRevenue != null) {
    lines.push(`Annual Revenue: ${account.annualRevenue}`);
  }

  if (account.rating) {
    lines.push(`Rating: ${account.rating}`);
  }

  if (account.phone) {
    lines.push(`Phone: ${account.phone}`);
  }

  if (account.fax) {
    lines.push(`Fax: ${account.fax}`);
  }

  if (account.website) {
    lines.push(`Website: ${account.website}`);
  }

  if (account.tickerSymbol) {
    lines.push(`Ticker Symbol: ${account.tickerSymbol}`);
  }

  if (account.ownership) {
    lines.push(`Ownership: ${account.ownership}`);
  }

  if (account.employees != null) {
    lines.push(`Employees: ${account.employees}`);
  }

  if (account.sicCode) {
    lines.push(`SIC Code: ${account.sicCode}`);
  }

  if (account.billingAddress) {
    lines.push("");
    lines.push("Billing Address");
    lines.push("----------------");

    const address = [
      account.billingAddress.street,
      account.billingAddress.city,
      account.billingAddress.state,
      account.billingAddress.country,
      account.billingAddress.zipCode,
    ]
      .filter(Boolean)
      .join(", ");

    if (address) {
      lines.push(address);
    }
  }

  if (account.shippingAddress) {
    lines.push("");
    lines.push("Shipping Address");
    lines.push("-----------------");

    const address = [
      account.shippingAddress.street,
      account.shippingAddress.city,
      account.shippingAddress.state,
      account.shippingAddress.country,
      account.shippingAddress.zipCode,
    ]
      .filter(Boolean)
      .join(", ");

    if (address) {
      lines.push(address);
    }
  }

  if (account.owner) {
    lines.push("");
    lines.push("Owner");
    lines.push("-----");
    lines.push(`Name: ${account.owner.name}`);

    if (account.owner.email) {
      lines.push(`Email: ${account.owner.email}`);
    }
  }

  if (account.createdBy) {
    lines.push("");
    lines.push("Created By");
    lines.push("----------");
    lines.push(`Name: ${account.createdBy.name}`);

    if (account.createdBy.email) {
      lines.push(`Email: ${account.createdBy.email}`);
    }
  }

  if (account.description) {
    lines.push("");
    lines.push("Description");
    lines.push("-----------");
    lines.push(account.description);
  }

  lines.push("");
  lines.push(`Created At: ${account.createdAt}`);

  if (account.updatedAt) {
    lines.push(`Updated At: ${account.updatedAt}`);
  }

  if (account.deletedAt) {
    lines.push(`Deleted At: ${account.deletedAt}`);
  }

  return lines.join("\n");
}

export function taskToDocument(task: any): string {
  const lines: string[] = [];

  lines.push("Task Information");
  lines.push("================");
  lines.push("");

  lines.push(`ID: ${task.id ?? ""}`);
  lines.push(`Subject: ${task.subject ?? ""}`);
  lines.push(`Description: ${task.description ?? ""}`);
  lines.push(`Status: ${task.status ?? ""}`);
  lines.push(`Priority: ${task.priority ?? ""}`);

  lines.push("");

  lines.push("Entity");
  lines.push("------");
  lines.push(`Entity Type: ${task.entityType ?? ""}`);
  lines.push(`Entity ID: ${task.entityId ?? ""}`);

  lines.push("");

  lines.push("Dates");
  lines.push("-----");
  lines.push(
    `Due Date: ${
      task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : ""
    }`
  );
  lines.push(
    `Created At: ${
      task.createdAt
        ? new Date(task.createdAt).toISOString()
        : ""
    }`
  );
  lines.push(
    `Updated At: ${
      task.updatedAt
        ? new Date(task.updatedAt).toISOString()
        : ""
    }`
  );

  lines.push("");

  lines.push("Users");
  lines.push("-----");
  lines.push(`Created By ID: ${task.createdById ?? ""}`);
  lines.push(`Created By: ${task.createdBy?.name ?? ""}`);
  lines.push(`Owner ID: ${task.ownerId ?? ""}`);
  lines.push(`Owner Name: ${task.owner?.name ?? ""}`);
  lines.push(`Owner Email: ${task.owner?.email ?? ""}`);

  lines.push("");

  lines.push("Google Calendar");
  lines.push("----------------");
  lines.push(`Google Event ID: ${task.googleEventId ?? ""}`);
  lines.push(`Sync Status: ${task.googleSyncStatus ?? ""}`);
  lines.push(
    `Last Synced At: ${
      task.googleSyncedAt
        ? new Date(task.googleSyncedAt).toISOString()
        : ""
    }`
  );

  return lines.join("\n");
}

export function callToDocument(call: any): string {
  const lines: string[] = [];

  lines.push("Call Information");
  lines.push("================");
  lines.push("");

  lines.push(`ID: ${call.id ?? ""}`);
  lines.push(`Subject: ${call.subject ?? ""}`);
  lines.push(`Purpose: ${call.purpose ?? ""}`);
  lines.push(`Status: ${call.status ?? ""}`);
  lines.push(`Result: ${call.result ?? ""}`);
  lines.push(`Agenda: ${call.agenda ?? ""}`);
  lines.push(`Description: ${call.description ?? ""}`);

  lines.push("");

  lines.push("Entity");
  lines.push("------");
  lines.push(`Entity Type: ${call.entityType ?? ""}`);
  lines.push(`Entity ID: ${call.entityId ?? ""}`);

  lines.push("");

  lines.push("Call Schedule");
  lines.push("-------------");
  lines.push(
    `Start Time: ${
      call.callStartTime
        ? new Date(call.callStartTime).toISOString()
        : ""
    }`
  );
  lines.push(`Duration: ${call.callDuration ?? 0} minutes`);

  lines.push("");

  lines.push("Users");
  lines.push("-----");
  lines.push(`Created By ID: ${call.createdById ?? ""}`);
  lines.push(`Created By: ${call.createdBy?.name ?? ""}`);
  lines.push(`Created By Email: ${call.createdBy?.email ?? ""}`);

  lines.push("");

  lines.push(`Owner ID: ${call.ownerId ?? ""}`);
  lines.push(`Owner Name: ${call.owner?.name ?? ""}`);
  lines.push(`Owner Email: ${call.owner?.email ?? ""}`);

  lines.push("");

  lines.push("Google Calendar");
  lines.push("----------------");
  lines.push(`Google Event ID: ${call.googleEventId ?? ""}`);
  lines.push(`Sync Status: ${call.googleSyncStatus ?? ""}`);
  lines.push(
    `Last Synced At: ${
      call.googleSyncedAt
        ? new Date(call.googleSyncedAt).toISOString()
        : ""
    }`
  );

  lines.push("");

  lines.push("Audit");
  lines.push("-----");
  lines.push(
    `Created At: ${
      call.createdAt
        ? new Date(call.createdAt).toISOString()
        : ""
    }`
  );
  lines.push(
    `Updated At: ${
      call.updatedAt
        ? new Date(call.updatedAt).toISOString()
        : ""
    }`
  );

  return lines.join("\n");
}

export function meetingToDocument(meeting: any): string {
  const lines: string[] = [];

  lines.push("Meeting Information");
  lines.push("===================");
  lines.push("");

  lines.push(`ID: ${meeting.id ?? ""}`);
  lines.push(`Title: ${meeting.title ?? ""}`);
  lines.push(`Description: ${meeting.description ?? ""}`);
  lines.push(`Status: ${meeting.status ?? ""}`);

  lines.push("");

  lines.push("Entity");
  lines.push("------");
  lines.push(`Entity Type: ${meeting.entityType ?? ""}`);
  lines.push(`Entity ID: ${meeting.entityId ?? ""}`);

  lines.push("");

  lines.push("Meeting Details");
  lines.push("---------------");
  lines.push(`Location: ${meeting.location ?? ""}`);
  lines.push(`Meeting URL: ${meeting.url ?? ""}`);
  lines.push(`Start Time: ${meeting.startTime ? new Date(meeting.startTime).toISOString() : ""}`);
  lines.push(`End Time: ${meeting.endTime ? new Date(meeting.endTime).toISOString() : ""}`);

  lines.push("");

  lines.push("Organizer");
  lines.push("---------");
  lines.push(`Created By ID: ${meeting.createdById ?? ""}`);
  lines.push(`Created By: ${meeting.createdBy?.name ?? ""}`);
  lines.push(`Created By Email: ${meeting.createdBy?.email ?? ""}`);

  lines.push("");
  lines.push("Participants");
  lines.push("------------");

  if (meeting.participants?.length) {
    meeting.participants.forEach((participant: any, index: number) => {
      lines.push(`Participant ${index + 1}:`);
      lines.push(`  Name: ${participant.user?.name ?? participant.name ?? ""}`);
      lines.push(`  Email: ${participant.user?.email ?? participant.email ?? ""}`);
      lines.push(`  Status: ${participant.status ?? ""}`);
      lines.push("");
    });
  } else {
    lines.push("No participants");
  }

  lines.push("");
  lines.push("Google Calendar");
  lines.push("----------------");
  lines.push(`Google Event ID: ${meeting.googleEventId ?? ""}`);
  lines.push(`Sync Status: ${meeting.googleSyncStatus ?? ""}`);
  lines.push(`Last Synced At: ${meeting.googleSyncedAt ? new Date(meeting.googleSyncedAt).toISOString() : ""}`);

  lines.push("");
  lines.push("Audit");
  lines.push("-----");
  lines.push(`Created At: ${meeting.createdAt ? new Date(meeting.createdAt).toISOString() : ""}`);
  lines.push(`Updated At: ${meeting.updatedAt ? new Date(meeting.updatedAt).toISOString() : ""}`);

  return lines.join("\n");
}