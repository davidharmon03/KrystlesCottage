import { useState, useEffect, useRef } from 'react'
import api from '../../api'

const PALETTE = [
  { label: 'Empty',    color: null,      bg: 'bg-white',          border: 'border-gray-300' },
  { label: 'Red',      color: '#ef44