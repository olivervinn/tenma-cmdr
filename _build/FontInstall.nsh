!include FontReg.nsh
!include FontName.nsh
!include WinMessages.nsh
Section "Fonts"
  StrCpy $FONT_DIR $FONTS
  !insertmacro InstallTTFFont "myFont-B.TTF"
  SendMessage ${HWND_BROADCAST} ${WM_FONTCHANGE} 0 0 /TIMEOUT=5000
SectionEnd