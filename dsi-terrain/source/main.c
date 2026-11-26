// SPDX-License-Identifier: CC0-1.0
//
// Native DS/DSi terrain and camera prototype.
// Procedural terrain avoids using any copyrighted game assets.

#include <stdio.h>
#include <nds.h>

#define TEX_SIZE 64
#define TERRAIN_CELLS 12
#define TERRAIN_SIZE 12.0f

static uint16_t texture_pixels[TEX_SIZE * TEX_SIZE];
static int texture_id;

static void make_test_texture(void)
{
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
            if (mortar) { r = 5; g = 7; b = 11; }
            texture_pixels[y * TEX_SIZE + x] =
                (uint16_t)(RGB15(r, g, b) | BIT(15));
        }
    }
}

static void draw_terrain(void)
{
    const float cell = TERRAIN_SIZE / TERRAIN_CELLS;
    const float start = -TERRAIN_SIZE * 0.5f;
    const int ground_y = floattov16(-1.0f);

    glDisable(GL_TEXTURE_2D);
    glBegin(GL_QUADS);
    for (int z = 0; z < TERRAIN_CELLS; z++)
    {
        for (int x = 0; x < TERRAIN_CELLS; x++)
        {
            // Three broad color zones make it easy to see camera movement.
            if (z < 3) glColor3f(0.62f, 0.53f, 0.30f);       // sandy edge
            else if (x > 8) glColor3f(0.30f, 0.42f, 0.20f);  // darker grass
            else glColor3f(0.38f, 0.58f, 0.25f);             // grass

            const int x0 = floattov16(start + x * cell);
            const int x1 = floattov16(start + (x + 1) * cell);
            const int z0 = floattov16(start + z * cell);
            const int z1 = floattov16(start + (z + 1) * cell);

            glVertex3v16(x0, ground_y, z0);
            glVertex3v16(x1, ground_y, z0);
            glVertex3v16(x1, ground_y, z1);
            glVertex3v16(x0, ground_y, z1);
        }
    }
    glEnd();
    glEnable(GL_TEXTURE_2D);
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
        glTexCoord2t16(uv0, uv1); glVertex3v16(lo, lo, near_z);
        glTexCoord2t16(uv1, uv1); glVertex3v16(hi, lo, near_z);
        glTexCoord2t16(uv1, uv0); glVertex3v16(hi, hi, near_z);
        glTexCoord2t16(uv0, uv0); glVertex3v16(lo, hi, near_z);

        glTexCoord2t16(uv0, uv1); glVertex3v16(hi, lo, far_z);
        glTexCoord2t16(uv1, uv1); glVertex3v16(lo, lo, far_z);
        glTexCoord2t16(uv1, uv0); glVertex3v16(lo, hi, far_z);
        glTexCoord2t16(uv0, uv0); glVertex3v16(hi, hi, far_z);

        glTexCoord2t16(uv0, uv1); glVertex3v16(lo, lo, far_z);
        glTexCoord2t16(uv1, uv1); glVertex3v16(lo, lo, near_z);
        glTexCoord2t16(uv1, uv0); glVertex3v16(lo, hi, near_z);
        glTexCoord2t16(uv0, uv0); glVertex3v16(lo, hi, far_z);

        glTexCoord2t16(uv0, uv1); glVertex3v16(hi, lo, near_z);
        glTexCoord2t16(uv1, uv1); glVertex3v16(hi, lo, far_z);
        glTexCoord2t16(uv1, uv0); glVertex3v16(hi, hi, far_z);
        glTexCoord2t16(uv0, uv0); glVertex3v16(hi, hi, near_z);

        glTexCoord2t16(uv0, uv1); glVertex3v16(lo, hi, near_z);
        glTexCoord2t16(uv1, uv1); glVertex3v16(hi, hi, near_z);
        glTexCoord2t16(uv1, uv0); glVertex3v16(hi, hi, far_z);
        glTexCoord2t16(uv0, uv0); glVertex3v16(lo, hi, far_z);

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

    vramSetBankA(VRAM_A_TEXTURE);
    make_test_texture();
    glGenTextures(1, &texture_id);
    glBindTexture(0, texture_id);
    if (glTexImageNtr2D(GL_RGBA, TEX_SIZE, TEX_SIZE,
                        TEXGEN_TEXCOORD | GL_TEXTURE_WRAP_S | GL_TEXTURE_WRAP_T,
                        texture_pixels, NULL) == 0)
    {
        printf("Texture upload failed.\\n");
        while (1) swiWaitForVBlank();
    }

    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluPerspective(65.0f, 256.0f / 192.0f, 0.1f, 40.0f);
    glMatrixMode(GL_MODELVIEW);

    float camera_x = 0.0f;
    float camera_y = 2.0f;
    float camera_z = 7.0f;
    int object_angle = 0;

    while (1)
    {
        swiWaitForVBlank();
        scanKeys();
        const uint16_t keys = keysHeld();

        if (keys & KEY_LEFT)  camera_x -= 0.045f;
        if (keys & KEY_RIGHT) camera_x += 0.045f;
        if (keys & KEY_UP)    camera_z -= 0.055f;
        if (keys & KEY_DOWN)  camera_z += 0.055f;
        if (keys & KEY_X)     camera_y += 0.045f;
        if (keys & KEY_Y)     camera_y -= 0.045f;

        if (keys & KEY_A)
        {
            camera_x = 0.0f;
            camera_y = 2.0f;
            camera_z = 7.0f;
        }
        if (keys & KEY_START) break;

        if (camera_x < -5.0f) camera_x = -5.0f;
        if (camera_x >  5.0f) camera_x =  5.0f;
        if (camera_y <  0.3f) camera_y =  0.3f;
        if (camera_y >  6.0f) camera_y =  6.0f;
        if (camera_z <  2.5f) camera_z =  2.5f;
        if (camera_z > 14.0f) camera_z = 14.0f;

        object_angle++;
        consoleClear();
        printf("OOT DSi - TERRAIN TEST\\n");
        printf("----------------------\\n");
        printf("D-pad: move camera X/Z\\n");
        printf("X/Y: camera height\\n");
        printf("A: reset camera\\n");
        printf("START: exit\\n\\n");
        printf("Camera: %.1f %.1f %.1f", camera_x, camera_y, camera_z);

        glMatrixMode(GL_MODELVIEW);
        glLoadIdentity();
        gluLookAt(camera_x, camera_y, camera_z,
                  0.0f, 0.0f, 0.0f,
                  0.0f, 1.0f, 0.0f);
        glPolyFmt(POLY_ALPHA(31) | POLY_CULL_NONE);
        draw_terrain();
        glPushMatrix();
        glTranslatef(0.0f, -0.15f, 0.0f);
        glRotateY(object_angle);
        glRotateX(18);
        draw_textured_cube();
        glPopMatrix();
        glFlush(0);
    }

    glDeleteTextures(1, &texture_id);
    return 0;
}
