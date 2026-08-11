# {{projectName}}

This project runs OpenCode through its REST API.

## Authentication

OpenCode can use Zed-managed models or project provider credentials.

## Verify the project

## Test the runtime

1. Create a session.
2. Send a real prompt.
3. Confirm that the response completes.

A provider availability check does not prove prompt execution. Test the model
that the project will use.

Run `zed system-skills get zed-system --full` for the current platform
instructions. Run `zed schema --version 2` for the exact manifest schema.
