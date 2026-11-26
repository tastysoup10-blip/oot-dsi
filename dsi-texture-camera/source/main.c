// SPDX-License-Identifier: CC0-1.0
//
// Native DS/DSi textured-cube and camera movement prototype.
// Uses a tiny procedural RGBA texture so no external game assets are needed.

#include <stdio.h>
#include <nds.h>

#define TEX_SIZE 64

static uint16_t texture_pixels[TEX_SIZE * TEX_SIZE];
static int texture_id;

static void make_test_texture(void)
{
    // A simple tiled stone-like pattern generated at runtime.
    for (int y = 0; y < TEX_SIZE; y++)
    {
        for (int x = 0; x < TEX_SIZE; x++)
        {
            const int tile_x = x / 8;
            const int tile_y = y / 8;
            const int mortar = (x % 8 == 0) || (y % 8 == 0);
            const int variation = ((tile_x * 3 + tile_y * 5) % 5);
            int r = 13 + variation;
            int g = 17 + variation;
            int b = 23 + variation;

            if (mortar)
            {
                r = 5;
                g = 7;
                b = 11;
            }

            texture_pixels[y * TEX_SIZE + x] =
                (uint16_t)(RGB15(r, g, b) | BIT(15));
        }
    }
}

static void draw_textured_cube(void)
{
    const int lo = floattov16(-0.8f);
    const int hi = floattov16( 0.8f);
    const int near_z = floattov16(0.8f);
    const int far_z = floattov16(-0.8f);
    const int uv0 = 0;
    const int uv1 = inttot16(TEX_SIZE);

    glBindTexture(0, texture_id);
    glColor3f(1.0f, 1.0f, 1.0f);

    glBegin(GL_QUADS);
        // Front
        glTexCoord2t16(uv0, uv1); glVertex3v16(lo, lo, near_z);
        glTexCoord2t16(uv1, uv1); glVertex3v16(hi, lo, near_z);
        glTexCoord2t16(uv1, uv0); glVertex3v16(hi, hi, near_z);
        glTexCoord2t16(uv0, uv0); glVertex3v16(lo, hi, near_z);

        // Back
        glTexCoord2t16(uv0, uv1); glVertex3v16(hi, lo, far_z);
        glTexCoord2t16(uv1, uv1); glVertex3v16(lo, lo, far_z);
        glTexCoord2t16(uv1, uv0); glVertex3v16(lo, hi, far_z);
        glTexCoord2t16(uv0, uv0); glVertex3v16(hi, hi, far_z);

        // Left
        glTexCoord2t16(uv0, uv1); glVertex3v16(lo, lo, far_z);
        glTexCoord2t16(uv1, uv1); glVertex3v16(lo, lo, near_z);
        glTexCoord2t16(uv1, uv0); glVertex3v16(lo, hi, near_z);
        glTexCoord2t16(uv0, uv0); glVertex3v16(lo, hi, far_z);

        // Right
        glTexCoord2t16(uv0, uv1); glVertex3v16(hi, lo, near_z);
        glTexCoord2t16(uv1, uv1); glVertex3v16(hi, lo, far_z);
        glTexCoord2t16(uv1, uv0); glVertex3v16(hi, hi, far_z);
        glTexCoord2t16(uv0, uv0); glVertex3v16(hi, hi, near_z);

        // Top
        glTexCoord2t16(uv0, uv1); glVertex3v16(lo, hi, near_z);
        glTexCoord2t16(uv1, uv1); glVertex3v16(hi, hi, near_z);
        glTexCoord2t16(uv1, uv0); glVertex3v16(hi, hi, far_z);
        glTexCoord2t16(uv0, uv0); glVertex3v16(lo, hi, far_z);

        // Bottom
        glTexCoord2t16(uv0, uv1); glVertex3v16(lo, lo, far_z);
        glTexCoord2t16(uv1, uv1); glVertex3v16(hi, lo, far_z);
        glTexCoord2t16(uv1, uv0); glVertex3v16(hi, lo, near_z);
        glTexCoord2t16(uv0, uv0); glVertex3v16(lo, lo, near_z);
    glEnd();
}

int main(void)
{
    consoleDemoInit();

    videoSetMode(MODE_0_3D);
    glInit();
    glEnable(GL_TEXTURE_2D);
    glEnable(GL_ANTIALIAS);

    glClearColor(4, 6, 12, 31);
    glClearPolyID(63);
    glClearDepth(0x7FFF);
    glViewport(0, 0, 255, 191);

    // Give the 3D engine a VRAM bank for texture storage.
    vramSetBankA(VRAM_A_TEXTURE);
    make_test_texture();

    glGenTextures(1, &texture_id);
    glBindTexture(0, texture_id);
    if (glTexImageNtr2D(GL_RGBA, TEX_SIZE, TEX_SIZE,
                        TEXGEN_TEXCOORD | GL_TEXTURE_WRAP_S | GL_TEXTURE_WRAP_T,
                        texture_pixels, NULL) == 0)
    {
        printf("Texture upload failed.\n");
        while (1)
            swiWaitForVBlank();
    }

    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluPerspective(65.0f, 256.0f / 192.0f, 0.1f, 40.0f);
    glMatrixMode(GL_MODELVIEW);

    // Camera position in world space. It always looks toward the origin.
    float camera_x = 0.0f;
    float camera_y = 1.0f;
    float camera_z = 4.5f;
    int object_angle = 0;

    while (1)
    {
        swiWaitForVBlank();
        scanKeys();
        const uint16_t keys = keysHeld();

        if (keys & KEY_LEFT)  camera_x -= 0.035f;
        if (keys & KEY_RIGHT) camera_x += 0.035f;
        if (keys & KEY_UP)    camera_z -= 0.045f;
        if (keys & KEY_DOWN)  camera_z += 0.045f;
        // Make vertical movement more noticeable, and show raw button detection below.
        if (keys & KEY_L)     camera_y += 0.06f;
        if (keys & KEY_R)     camera_y -= 0.06f;

        if (keys & KEY_A)
        {
            camera_x = 0.0f;
            camera_y = 1.0f;
            camera_z = 4.5f;
        }

        if (keys & KEY_START)
            break;

        // Keep the camera in a useful range around the test object.
        if (camera_x < -3.0f) camera_x = -3.0f;
        if (camera_x >  3.0f) camera_x =  3.0f;
        if (camera_y < -2.0f) camera_y = -2.0f;
        if (camera_y >  3.0f) camera_y =  3.0f;
        if (camera_z <  2.0f) camera_z =  2.0f;
        if (camera_z >  8.0f) camera_z =  8.0f;

        object_angle += 1;

        consoleClear();
        printf("OOT DSi - TEXTURE/CAMERA\n");
        printf("------------------------\n");
        printf("D-pad: move camera X/Z\n");
        printf("L/R: camera height\n");
        printf("A: reset camera\n");
        printf("START: exit\n\n");
        printf("Camera: %.1f %.1f %.1f\\n", camera_x, camera_y, camera_z);
        printf("Keys: 0x%04X", keys);

        glMatrixMode(GL_MODELVIEW);
        glLoadIdentity();
        gluLookAt(camera_x, camera_y, camera_z,
                  0.0f, 0.0f, 0.0f,
                  0.0f, 1.0f, 0.0f);
        glRotateY(object_angle);
        glRotateX(18);
        glPolyFmt(POLY_ALPHA(31) | POLY_CULL_NONE);
        draw_textured_cube();
        glFlush(0);
    }

    glDeleteTextures(1, &texture_id);
    return 0;
}
