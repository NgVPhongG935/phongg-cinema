@echo off
if not exist tmdb.local.cmd (
  copy /Y tmdb.local.cmd.example tmdb.local.cmd
  echo Tao tmdb.local.cmd — dien TMDB_API_KEY va restart backend.
  notepad tmdb.local.cmd
) else (
  notepad tmdb.local.cmd
)
