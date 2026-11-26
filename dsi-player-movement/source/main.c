// SPDX-License-Identifier: CC0-1.0
//
// OOT-inspired player movement prototype for Nintendo DS/DSi.
// Original placeholder geometry and movement implementation.
// No copyrighted game assets or copied game code are included.

#include <stdio.h>
#include <math.h>
#include <nds.h>

#define PI 3.14159265358979323846f
#define TERRAIN_CELLS 16
#define TERRAIN_SIZE 16.0f
#define HALF_TERRAIN (TERRAIN_SIZE * 0.5f)

typedef struct {
    float x;
    float z;
    float yaw;
    float vertical_velocity;
    float walk_speed;
    int grounded;
} Player;

static void draw_box(float sx, float sy, float sz)
{
    const int x = floattov16(sx * 0.5f);
    const int y = floattov16(sy * 0.5f);
    const int z = floattov16(sz * 0.5f);

    glBegin(GL_QUADS);
    // Front
    glVertex3v16(-x,-y,z); glVertex3v16(x,-y,z);
    glVertex3v16(x,y,z); glVertex3v16(-x,y,z);
    // Back
    glVertex3v16(x,-y,-z); glVertex3v16(-x,-y,-z);
    glVertex3v16(-x,y,-z); glVertex3v16(x,y,-z);
    // Left
    glVertex3v16(-x,-y,-z); glVertex3v16(-x,-y,z);
    glVertex3v16(-x,y,z); glVertex3v16(-x,y,-z);
    // Right
    glVertex3v16(x,-y,z); glVertex3v16(x,-y,-z);
    glVertex3v16(x,y,-z); glVertex3v16(x,y,z);
    // Top
    glVertex3v16(-x,y,z); glVertex3v16(x,y,z);
    glVertex3v16(x,y,-z); glVertex3v16(-x,y,-z);
    // Bottom
    glVertex3v16(-x,-y,-z); glVertex3v16(x,-y,-z);
    glVertex3v16(x,-y,z); glVertex3v16(-x,-y,z);
    glEnd();
}

static void draw_terrain(void)
{
    const float cell = TERRAIN_SIZE / TERRAIN_CELLS;
    const float start = -HALF_TERRAIN;
    const int ground_y = floattov16(-0.05f);

    glDisable(GL_TEXTURE_2D);
    glBegin(GL_QUADS);
    for (int z = 0; z < TERRAIN_CELLS; z++) {
        for (int x = 0; x < TERRAIN_CELLS; x++) {
            if (z < 3) glColor3f(0.62f, 0.53f, 0.30f);
            else if (x > 11) glColor3f(0.28f, 0.39f, 0.19f);
            else glColor3f(0.38f, 0.58f, 0.25f);

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
}

static void draw_player(const Player *p)
{
    glPushMatrix();
    glTranslatef(p->x, 0.0f, p->z);
    glRotateY((int)p->yaw);

    // Green tunic/body
    glColor3f(0.12f, 0.42f, 0.18f);
    glPushMatrix();
    glTranslatef(0.0f, 0.62f, 0.0f);
    draw_box(0.48f, 0.72f, 0.30f);
    glPopMatrix(1);

    // Head
    glColor3f(0.82f, 0.66f, 0.48f);
    glPushMatrix();
    glTranslatef(0.0f, 1.18f, 0.0f);
    draw_box(0.34f, 0.34f, 0.32f);
    glPopMatrix(1);

    // Boots / legs
    glColor3f(0.28f, 0.20f, 0.12f);
    glPushMatrix();
    glTranslatef(-0.13f, 0.16f, 0.0f);
    draw_box(0.16f, 0.32f, 0.20f);
    glPopMatrix(1);
    glPushMatrix();
    glTranslatef(0.13f, 0.16f, 0.0f);
    draw_box(0.16f, 0.32f, 0.20f);
    glPopMatrix(1);

    glPopMatrix(1);
}

static void update_player(Player *p, uint16_t held, uint16_t down)
{
    const float turn_speed = 2.4f;
    float move_speed = 0.055f;

    // Tank-style steering: left/right turn, up/down move along facing.
    if (held & KEY_LEFT)  p->yaw += turn_speed;
    if (held & KEY_RIGHT) p->yaw -= turn_speed;
    if (p->yaw >= 360.0f) p->yaw -= 360.0f;
    if (p->yaw < 0.0f) p->yaw += 360.0f;

    if (held & KEY_B) move_speed = 0.105f;
    if (held & KEY_UP) {
        p->x += sinf(p->yaw * PI / 180.0f) * move_speed;
        p->z -= cosf(p->yaw * PI / 180.0f) * move_speed;
    }
    if (held & KEY_DOWN) {
        p->x -= sinf(p->yaw * PI / 180.0f) * move_speed * 0.65f;
        p->z += cosf(p->yaw * PI / 180.0f) * move_speed * 0.65f;
    }

    // Simple jump arc; A is edge-triggered so holding it won't auto-hop.
    if ((down & KEY_A) && p->grounded) {
        p->vertical_velocity = 0.19f;
        p->grounded = 0;
    }
    if (!p->grounded) {
        p->vertical_velocity -= 0.009f;
        p->walk_speed += p->vertical_velocity;
        if (p->walk_speed <= 0.0f) {
            p->walk_speed = 0.0f;
            p->vertical_velocity = 0.0f;
            p->grounded = 1;
        }
    }

    // Keep the player inside the test island.
    if (p->x < -HALF_TERRAIN + 0.5f) p->x = -HALF_TERRAIN + 0.5f;
    if (p->x >  HALF_TERRAIN - 0.5f) p->x =  HALF_TERRAIN - 0.5f;
    if (p->z < -HALF_TERRAIN + 0.5f) p->z = -HALF_TERRAIN + 0.5f;
    if (p->z >  HALF_TERRAIN - 0.5f) p->z =  HALF_TERRAIN - 0.5f;
}

int main(void)
{
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
    gluPerspective(60.0f, 256.0f / 192.0f, 0.1f, 50.0f);
    glMatrixMode(GL_MODELVIEW);

    Player player = { 0.0f, 2.0f, 0.0f, 0.0f, 0.0f, 1 };
    int frames = 0;

    while (1) {
        swiWaitForVBlank();
        scanKeys();
        const uint16_t held = keysHeld();
        const uint16_t down = keysDown();
        if (held & KEY_START) break;

        update_player(&player, held, down);
        frames++;

        // Camera follows behind the player's facing direction.
        const float yaw = player.yaw * PI / 180.0f;
        const float cam_x = player.x - sinf(yaw) * 3.8f;
        const float cam_z = player.z + cosf(yaw) * 3.8f;

        consoleClear();
        printf("OOT DSi - PLAYER TEST\n");
        printf("----------------------\n");
        printf("UP/DOWN: walk / back\n");
        printf("LEFT/RIGHT: turn\n");
        printf("B + UP: run\n");
        printf("A: jump\n");
        printf("START: exit\n\n");
        printf("Pos: %.2f, %.2f\n", player.x, player.z);
        printf("Facing: %.0f deg", player.yaw);

        glMatrixMode(GL_MODELVIEW);
        glLoadIdentity();
        gluLookAt(cam_x, 2.8f, cam_z,
                  player.x, 0.65f + player.walk_speed, player.z,
                  0.0f, 1.0f, 0.0f);
        glPolyFmt(POLY_ALPHA(31) | POLY_CULL_NONE);
        draw_terrain();
        draw_player(&player);
        glFlush(0);
    }

    return 0;
}
