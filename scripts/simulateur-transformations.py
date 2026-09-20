"""Simulateur fidèle des transformations React Native.

RN compose la liste `transform` de gauche à droite : M = T1 · T2 · ... · Tn,
et le point de départ est le centre de la vue. On reproduit exactement cela,
puis on applique la matrice inverse avec PIL pour obtenir le rendu.
"""
import math
import numpy as np
from PIL import Image


def mat(**op):
    m = np.eye(3)
    if 'translateX' in op: m = m @ np.array([[1, 0, op['translateX']], [0, 1, 0], [0, 0, 1]])
    if 'translateY' in op: m = m @ np.array([[1, 0, 0], [0, 1, op['translateY']], [0, 0, 1]])
    if 'rotate' in op:
        a = math.radians(op['rotate'])
        m = m @ np.array([[math.cos(a), -math.sin(a), 0], [math.sin(a), math.cos(a), 0], [0, 0, 1]])
    if 'scale' in op: m = m @ np.diag([op['scale'], op['scale'], 1])
    if 'scaleX' in op: m = m @ np.diag([op['scaleX'], 1, 1])
    if 'scaleY' in op: m = m @ np.diag([1, op['scaleY'], 1])
    return m


def compose(ops):
    m = np.eye(3)
    for op in ops:
        m = m @ mat(**op)
    return m


def render(layer, ops, size):
    """Applique la transformation autour du centre de la vue, comme RN."""
    c = np.array([[1, 0, size / 2], [0, 1, size / 2], [0, 0, 1]])
    full = c @ compose(ops) @ np.linalg.inv(c)
    inv = np.linalg.inv(full)
    return layer.transform((size, size), Image.AFFINE,
                           (inv[0, 0], inv[0, 1], inv[0, 2], inv[1, 0], inv[1, 1], inv[1, 2]),
                           resample=Image.BICUBIC)
