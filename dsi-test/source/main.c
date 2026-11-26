// SPDX-License-Identifier: CC0-1.0
//
// First native DS/DSi graphics experiment for the OOT DSi port project.
// Based on the BlocksDS basic_cube example (CC0-1.0).

#include <stdio.h>
#include <nds.h>

static void draw_cube(void)
{
    const int lo = floattov16(-0.75f);
    const int hi = floattov16( 0.75f);

    glBegin(GL_QUADS);
        // Front
        glColor3f(1.0f, 0.2f, 0.2f);
        glVertex3v16(lo, lo, hi);
        glVertex3v16(hi, lo, hi);
        glVertex3v16(hi, hi, hi);
        glVertex3v16(lo, hi, hi);

        // Back
        glColor3f(0.2f, 1.0f, 0.2f);
        glVertex3v16(hi, lo, lo);
        glVertex3v16(lo, lo, lo);
        glVertex3v16(lo, hi, lo);
        glVertex3v16(hi, hi, lo);

        // Left
        glColor3f(0.2f, 0.4f, 1.0f);
        glVertex3v16(lo, lo, lo);
        glVertex3v16(lo, lo, hi);
        glVertex3v16(lo, hi, hi);
        glVertex3v16(lo, hi, lo);

        // Right
        glColor3f(1.0f, 1.0f, 0.2f);
        glVertex3v16(hi, lo, hi);
        glVertex3v16(hi, lo, lo);
        glVertex3v16(hi, hi, lo);
        glVertex3v16(hi, hi, hi);

        // Top
        glColor3f(0.2f, 1.0f, 1.0f);
        glVertex3v16(lo, hi, hi);
        glVertex3v16(hi, hi, hi);
        glVertex3v16(hi, hi, lo);
        glVertex3v16(lo, hi, lo);

        // Bottom
        glColor3f(1.0f, 0.2f, 1.0f);
        glVertex3v16(lo, lo, lo);
        glVertex3v16(hi, lo, lo);
        glVertex3v16(hi, lo, hi);
        glVertex3v16(lo, lo, hi);
    glEnd();
}

int main(void)
{
    // Text console on the sub screen; 3D graphics on the main (top) screen.
    consoleDemoInit();

    videoSetMode(MODE_0_3D);
    glInit();
    glEnable(GL_ANTIALIAS);

    glClearColor(4, 6, 12, 31);
    glClearPolyID(63);
    glClearDepth(0x7FFF);
    glViewport(0, 0, 255, 191);

    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluPerspective(65.0f, 256.0f / 192.0f, 0.1f, 40.0f);
    glMatrixMode(GL_MODELVIEW);

    int angle_x = 25;
    int angle_y = 25;

    while (1)
    {
        swiWaitForVBlank();
        scanKeys();
        const uint16_t keys = keysHeld();

        if (keys & KEY_UP)    angle_x -= 2;
        if (keys & KEY_DOWN)  angle_x += 2;
        if (keys & KEY_LEFT)  angle_y -= 2;
        if (keys & KEY_RIGHT) angle_y += 2;
        if (keys & KEY_START) break;

        // A gentle automatic spin makes it obvious that frames are updating.
        angle_y += 1;

        consoleClear();
        iprintf("OOT DSi - 3D TEST\n");
        iprintf("----------------\n");
        iprintf("D-pad: rotate cube\n");
        iprintf("START: exit\n\n");
        iprintf("Native DS 3D hardware");

        glLoadIdentity();
        gluLookAt(0.0f, 0.0f, 4.0f,
                  0.0f, 0.0f, 0.0f,
                  0.0f, 1.0f, 0.0f);
        glRotateY(angle_y);
        glRotateX(angle_x);
        glPolyFmt(POLY_ALPHA(31) | POLY_CULL_NONE);
        draw_cube();
        glFlush(0);
    }

    return 0;
}
