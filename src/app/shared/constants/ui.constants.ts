export const UI = {
  layout: {
    headerHeight: 64,
    headerHeightMobile: 56,

    sidebarWidth: 260,
    sidebarWidthCollapsed: 72,

    rightSidebarWidth: 320,

    contentMaxWidth: 1440,

    contentPadding: 24,
    contentPaddingMobile: 16,

    footerHeight: 64,
  },

  spacing: {
    none: 0,

    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,

    section: 40,
    sectionLarge: 48,
    page: 64,
  },

  radius: {
    none: 0,

    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 26,

    pill: 9999,
    circle: 9999,
  },

  typography: {
    fontFamily: {
      heading: "'Patrick Hand', cursive",
      body: "'Nunito', sans-serif",
      mono: "'JetBrains Mono', monospace",
    },

    size: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 30,
      display: 36,
      displayLarge: 48,
    },

    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
  },

  button: {
    height: {
      xs: 28,
      sm: 32,
      md: 40,
      lg: 48,
      xl: 56,
    },

    minWidth: {
      xs: 64,
      sm: 80,
      md: 100,
      lg: 120,
      xl: 140,
    },

    paddingX: {
      xs: 8,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
    },

    paddingY: {
      xs: 4,
      sm: 6,
      md: 8,
      lg: 12,
      xl: 16,
    },

    iconSize: {
      xs: 14,
      sm: 16,
      md: 18,
      lg: 20,
      xl: 24,
    },

    gap: {
      xs: 4,
      sm: 6,
      md: 8,
      lg: 10,
      xl: 12,
    },

    radius: {
      xs: 6,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      pill: 9999,
    },

    variant: {
      primary: {
        background: '#111111',
        hover: '#000000',
        active: '#000000',
        text: '#FFFFFF',
        border: '#111111',
      },

      secondary: {
        background: '#FFFFFF',
        hover: '#F5EFE4',
        active: '#ECE4D7',
        text: '#222222',
        border: '#D7D0C4',
      },

      accent: {
        background: '#D97706',
        hover: '#B45309',
        active: '#92400E',
        text: '#FFFFFF',
        border: '#D97706',
      },

      success: {
        background: '#16A34A',
        hover: '#15803D',
        active: '#166534',
        text: '#FFFFFF',
        border: '#16A34A',
      },

      warning: {
        background: '#D97706',
        hover: '#B45309',
        active: '#92400E',
        text: '#FFFFFF',
        border: '#D97706',
      },

      danger: {
        background: '#DC2626',
        hover: '#B91C1C',
        active: '#991B1B',
        text: '#FFFFFF',
        border: '#DC2626',
      },

      info: {
        background: '#2563EB',
        hover: '#1D4ED8',
        active: '#1E40AF',
        text: '#FFFFFF',
        border: '#2563EB',
      },

      outline: {
        background: 'transparent',
        hover: '#F5EFE4',
        active: '#ECE4D7',
        text: '#111111',
        border: '#D7D0C4',
      },

      ghost: {
        background: 'transparent',
        hover: '#ECE4D7',
        active: '#DDD5C8',
        text: '#111111',
        border: 'transparent',
      },

      link: {
        background: 'transparent',
        hover: 'transparent',
        active: 'transparent',
        text: '#111111',
        border: 'transparent',
      },

      noteYellow: {
        background: '#FFEB3B',
        hover: '#FDD835',
        active: '#F9A825',
        text: '#111111',
        border: '#E1C400',
      },

      noteOrange: {
        background: '#FFA500',
        hover: '#FF8C00',
        active: '#F57C00',
        text: '#111111',
        border: '#E67E00',
      },

      notePink: {
        background: '#FFC0CB',
        hover: '#FFB6C1',
        active: '#FF91A4',
        text: '#111111',
        border: '#E8A3AF',
      },

      noteRed: {
        background: '#FF6B6B',
        hover: '#F05252',
        active: '#DC2626',
        text: '#FFFFFF',
        border: '#E05252',
      },

      noteGreen: {
        background: '#4CAF50',
        hover: '#43A047',
        active: '#388E3C',
        text: '#FFFFFF',
        border: '#388E3C',
      },

      noteBlue: {
        background: '#2196F3',
        hover: '#1E88E5',
        active: '#1976D2',
        text: '#FFFFFF',
        border: '#1976D2',
      },

      notePurple: {
        background: '#9C27B0',
        hover: '#8E24AA',
        active: '#7B1FA2',
        text: '#FFFFFF',
        border: '#7B1FA2',
      },

      noteBrown: {
        background: '#8B4513',
        hover: '#7A3B10',
        active: '#6F3410',
        text: '#FFFFFF',
        border: '#6F3410',
      },

      noteBlack: {
        background: '#000000',
        hover: '#222222',
        active: '#111111',
        text: '#FFFFFF',
        border: '#000000',
      },
    },
  },

  input: {
    height: {
      xs: 30,
      sm: 36,
      md: 42,
      lg: 48,
      xl: 56,
    },
    paddingX: {
      sm: 10,
      md: 12,
      lg: 16,
    },
    iconSize: 18,
    radius: 12,
    borderWidth: 1,
    focusBorderWidth: 2,
  },

  card: {
    padding: {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    },

    radius: {
      sm: 12,
      md: 16,
      lg: 20,
      xl: 26,
    },

    minHeight: 100,
    headerHeight: 56,
    footerHeight: 56,

    default: {
      background: '#FFFDF8',
      border: '#DDD5C8',
      text: '#1D1D1D',
    },

    paper: {
      background: '#FDF9F2',
      border: '#EEE7DC',
      text: '#1D1D1D',
    },

    glass: {
      background: 'rgba(255, 255, 255, 0.55)',
      border: 'rgba(255, 255, 255, 0.4)',
      text: '#1D1D1D',
    },

    dark: {
      background: '#111111',
      border: '#2D2D2D',
      text: '#FFFFFF',
    },

    noteYellow: {
      background: '#FFEB3B',
      border: '#E1C400',
      text: '#111111',
    },

    noteOrange: {
      background: '#FFA500',
      border: '#E67E00',
      text: '#111111',
    },

    notePink: {
      background: '#FFC0CB',
      border: '#E8A3AF',
      text: '#111111',
    },

    noteGreen: {
      background: '#4CAF50',
      border: '#388E3C',
      text: '#FFFFFF',
    },

    noteBlue: {
      background: '#2196F3',
      border: '#1976D2',
      text: '#FFFFFF',
    },

    notePurple: {
      background: '#9C27B0',
      border: '#7B1FA2',
      text: '#FFFFFF',
    },
  },

  stickyNote: {
    minWidth: 220,
    defaultWidth: 280,
    maxWidth: 500,
    minHeight: 180,
    defaultHeight: 240,
    maxHeight: 600,
    padding: 16,
    headerHeight: 40,
    footerHeight: 36,
    iconSize: 18,
    colors: {
      yellow: '#FFEB3B',
      orange: '#FFA500',
      red: '#FF6B6B',
      pink: '#FFC0CB',
      green: '#4CAF50',
      blue: '#2196F3',
      purple: '#9C27B0',
      brown: '#8B4513',
      white: '#FFFFFF',
      black: '#000000',
    },
  },

  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    xxl: 80,
  },

  badge: {
    height: {
      sm: 20,
      md: 24,
      lg: 28,
    },
    paddingX: {
      sm: 6,
      md: 8,
      lg: 10,
    },
    radius: 9999,
    dotSize: 8,
  },

  modal: {
    width: {
      sm: 400,
      md: 560,
      lg: 720,
      xl: 960,
    },
    maxWidth: '90vw',
    maxHeight: '90vh',
    headerHeight: 64,
    footerHeight: 64,
    padding: 24,
    radius: 20,
  },

  dropdown: {
    minWidth: 180,
    width: 240,
    maxWidth: 360,
    maxHeight: 400,
    padding: 8,
    itemHeight: 40,
    itemPaddingX: 12,
  },

  table: {
    minWidth: 700,
    headerHeight: 48,
    rowHeight: {
      sm: 40,
      md: 52,
      lg: 64,
    },
    cellPaddingX: 16,
    cellPaddingY: 12,
    actionColumnWidth: 100,
  },

  sidebar: {
    background: '#F5EFE4',
    hover: '#ECE4D7',
    active: '#111111',
    activeText: '#FFFFFF',
    itemHeight: 40,
    itemPaddingX: 12,
    iconSize: 20,
    gap: 10,
    sectionGap: 20,
  },

  color: {
    brand: {
      primary: '#111111',
      primaryHover: '#000000',
      primaryLight: '#2D2D2D',

      secondary: '#7A6E5B',

      accent: '#D97706',
      accentHover: '#B45309',
    },

    background: {
      app: '#F7F2E8',
      page: '#FDF9F2',
      paper: '#FFFDF8',
      paperLight: '#FFFCF7',
      paperDark: '#F4EEE2',
    },

    text: {
      primary: '#1D1D1D',
      secondary: '#5F5F5F',
      light: '#888888',
      heading: '#111111',
      white: '#FFFFFF',
    },

    border: {
      default: '#DDD5C8',
      light: '#EEE7DC',
      dark: '#C8BFAF',
    },

    status: {
      success: '#16A34A',
      warning: '#D97706',
      danger: '#DC2626',
      info: '#2563EB',
    },

    sidebar: {
      background: '#F5EFE4',
      hover: '#ECE4D7',
      active: '#111111',
      activeText: '#FFFFFF',
    },

    header: {
      background: 'rgba(255, 255, 255, 0.65)',
      border: 'rgba(0, 0, 0, 0.05)',
    },

    glass: {
      background: 'rgba(255, 255, 255, 0.55)',
      border: 'rgba(255, 255, 255, 0.4)',
    },
  },

  shadow: {
    none: 'none',
    xs: '0 1px 3px rgba(0, 0, 0, 0.04)',
    sm: '0 2px 6px rgba(0, 0, 0, 0.06)',
    md: '0 8px 24px rgba(0, 0, 0, 0.08)',
    lg: '0 16px 40px rgba(0, 0, 0, 0.12)',
    xl: '0 24px 60px rgba(0, 0, 0, 0.16)',
    note: '2px 4px 12px rgba(0, 0, 0, 0.12)',
  },

  transition: {
    fast: 'all 0.15s ease',
    normal: 'all 0.25s ease',
    slow: 'all 0.35s ease',
  },

  zIndex: {
    base: 1,
    dropdown: 1000,
    sticky: 1100,
    sidebar: 1200,
    header: 1300,
    overlay: 1400,
    modal: 1500,
    popover: 1600,
    tooltip: 1700,
    toast: 1800,
  },

  breakpoint: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
    xxxl: 1600,
  },
} as const;
