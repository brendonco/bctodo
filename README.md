bctodo
======

Enhancement of TODO List from BackBoneJS Sample

Changes:
 - Added "created timestamp" and "last modified timestamp" for each entry (default to be same as when the entry is created)
 - Restrict to a text of up to 140 alphanumeric characters (only 1-9, a-z, A-Z are allowed
 - Sanitise the body text before saving so that it contains strictly 1 space between each words and each word contains no more than 30 characters. If there are more than 1 spaces, truncate to 1. If there are any words longer than 30 characters, trim them to the first 30 characters.
 - Restriction of deletion of entries to only those that are marked as 'completed'. If user tries to delete an incomplete entry, he/she should see an popup error message that they must first mark the entry as complete before deleting.
 - Usage of a warning/error popup to inform user, user can click on an 'X' sign to close it or press Escape. The popup should fade away by itself in 3 seconds if left alone.
 - Styling using Bootstrap
