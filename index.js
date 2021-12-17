/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

const find = require('min-dash').find;
const MODERATORS = require('./resources/assignes');

module.exports = (app) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");

  app.on("issues.closed", async (context) => {

    const {
      octokit,
      payload
    } = context;

    const {
      issue,
      repository
    } = payload;

    if (!hasWeeklyLabel(issue)) {
      return;
    }

    const {
      login,
      fullName
    } = getNextRoundRobin(issue, 1)|| {};

    const {
      data: createdIssue
    } = await octokit.issues.create({
      owner: repository.owner.login,
      repo: repository.name,
      title: "created by bot",
      labels: [ 'team event', 'ready' ],
      assignees: ['smbea']
    });

    const issueComment = context.issue({
      body: `Opened next one: ${createdIssue.html_url}.
      Assigne: ${fullName}`,
    });

    return octokit.issues.createComment(issueComment);
  });
};

// helper ////////////////

function hasWeeklyLabel(issue) {
  const {
    labels
  } = issue;

  return !!find(labels, (l) => l.name === 'team event');
}

function getNextRoundRobin(closedIssue, offset = 1) {
  function transformIntoBounds(idx, length) {
    return idx >= length ? transformIntoBounds(idx - length, length) : idx;
  }

  const {
    assignee
  } = closedIssue;

  if (!assignee) {
    return;
  }

  const lastAssignee = find(MODERATORS, m => m.login === assignee.login);

  // ensure assignee was a valid moderator
  if (!lastAssignee) {
    return;
  }

  return MODERATORS[transformIntoBounds(lastAssignee.idx + offset, MODERATORS.length)];
}